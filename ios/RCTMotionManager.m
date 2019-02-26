//
//  RCTMotionManager.m
//  RCTVideo
//
//  Created by June Kim on 1/28/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "RCTMotionManager.h"
#include <CoreMotion/CoreMotion.h>
#import <math.h>
#import "OvalCalculator.h"
#import "RCTFramelessCounter.h"

static double const kMaxLockAngle = -0.209;  // 12 degree, clockwise
static double const kMinLockAngle = -6.074;   // 12 degree, counter-clockwise

typedef enum {
  RCTMotionManagerStateFree,      // Free to track device rotation
  RCTMotionManagerStateLocked,    // Locked to certain angles
  RCTMotionManagerStateUnlocking  // During an unlock animation
} RCTMotionManagerState;

@implementation RCTMotionManager {
  CMMotionManager *_motionManager;
  RCTMotionManagerUpdatesHandler _updatesHandler;
  OvalCalculator *_scaler;
  double _videoWidth;
  double _videoHeight;
  double _viewWidth;
  double _viewHeight;
  
  RCTMotionManagerState _lockState;
  CADisplayLink *_animatorSampler;
  CFTimeInterval _animationStartTime;
  double _initialRotationWhenUnlocking;
  double _rotationDeltaForUnlocking;
  
  RCTFramelessCounter *_framelessCounter;
}

- (instancetype)initWithVideoWidth:(double)videoWidth videoHeight:(double)videoHeight viewWidth:(double)viewWidth viewHeight:(double)viewHeight {
  self = [super init];
  if (self) {
    _motionManager = [CMMotionManager new];
    _motionManager.deviceMotionUpdateInterval = 1/30.0;
    _scaler = [[OvalCalculator alloc] init];
    _videoWidth = videoWidth;
    _videoHeight = videoHeight;
    _viewWidth = viewWidth;
    _viewHeight = viewHeight;
    _framelessCounter = [[RCTFramelessCounter alloc] init];
  }
  return self;
}

- (CGAffineTransform) transformWithRotation: (CGFloat) rotation {
  [_scaler set_fit];
  double scale =
  [_scaler get_scaleWithDouble:_viewWidth
                    withDouble:_viewHeight
                    withDouble:_videoWidth
                    withDouble:_videoHeight
                    withDouble:rotation];
  CGAffineTransform transform = CGAffineTransformMakeScale(scale, scale);
  return CGAffineTransformRotate(transform, rotation);
}

- (BOOL) isFlatWithGravity:(CMAcceleration) gravity {
  return fabs(gravity.x) < 0.2 && fabs(gravity.y) < 0.2;
}

- (void)startDeviceMotionUpdatesWithHandler:(RCTMotionManagerUpdatesHandler)handler {
  _updatesHandler = [handler copy];
  __block double lastX = -1;
  __block double lastY = -1;
  double minDecay = 0.15;
  __weak RCTMotionManager *weakSelf = self;
  [_motionManager startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue] withHandler:^(CMDeviceMotion * _Nullable motion, NSError * _Nullable error) {
    
    __strong RCTMotionManager *strongSelf = weakSelf;
    if (strongSelf == nil) { return; }
    if (strongSelf->_lockState == RCTMotionManagerStateUnlocking) {
      // Unlocking animation is going on, don't use sensor's input
      return;
    }
    if (motion == nil) { return; }
    
    CMAcceleration gravity = motion.gravity;
    if ([strongSelf isFlatWithGravity:gravity]) { return; }
    
    double decay = minDecay + fabs(gravity.x) * (1 - minDecay);
    
    lastX = gravity.x * decay + lastX * (1 - decay);
    lastY = gravity.y * decay + lastY * (1 - decay);
    
    double rawRotation = atan2(lastX, lastY) - M_PI;
    double displayRotation = [strongSelf.class rotationWithLockState:_lockState rawRotation:rawRotation];
    _initialRotationWhenUnlocking = displayRotation;
    _rotationDeltaForUnlocking = rawRotation - displayRotation;
    
    double normalizedDisplayRotationDegrees;
    if (displayRotation < 0) {
      normalizedDisplayRotationDegrees = (displayRotation + 2 * M_PI ) / M_PI * 180.0;
    } else {
      normalizedDisplayRotationDegrees = (displayRotation) / M_PI * 180.0;
    }
    [strongSelf->_framelessCounter record:normalizedDisplayRotationDegrees];
    
    if (handler) {
      handler([strongSelf transformWithRotation:displayRotation]);
    }
  }];
}

- (CGAffineTransform)getZeroRotationTransform {
  return [self transformWithRotation:0];
}

- (void)stopDeviceMotionUpdates {
  [_motionManager stopDeviceMotionUpdates];
}

#pragma mark - Time Lock

+ (double)rotationWithLockState:(RCTMotionManagerState)lockState rawRotation:(double)rawRotaton {
  static double midLockAngle = (kMinLockAngle + kMaxLockAngle) / 2.0;
  if (lockState == RCTMotionManagerStateLocked) {
    if (rawRotaton > kMinLockAngle && rawRotaton <= midLockAngle) {
      return kMinLockAngle;
    } else if (rawRotaton > midLockAngle && rawRotaton < kMaxLockAngle) {
      return kMaxLockAngle;
    }
  }
  return rawRotaton;
}

- (void)lock {
  _lockState = RCTMotionManagerStateLocked;
}

- (void)unLock {
  _lockState = RCTMotionManagerStateUnlocking;
  
  _animationStartTime = CACurrentMediaTime();
  _animatorSampler = [CADisplayLink displayLinkWithTarget:self selector:@selector(sampleAnimator:)];
  [_animatorSampler addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
  _animatorSampler.frameInterval = 1;
}

- (NSDictionary*) framelessProperties {
  NSDictionary* properties =  [_framelessCounter trackingProperties];
  [_framelessCounter resetCount];
  return properties;
}

- (void)sampleAnimator:(CADisplayLink *)sampler {
  CFTimeInterval timeElapsed = CACurrentMediaTime() - _animationStartTime;
  double factor = [self springAnimationFactorWithTimeElapsed:timeElapsed];
  double rotation = _initialRotationWhenUnlocking + _rotationDeltaForUnlocking * factor;
  if (_updatesHandler) {
    _updatesHandler([self transformWithRotation:rotation]);
  }
  
  if (timeElapsed > 1.0) {
    [sampler invalidate];
    _lockState = RCTMotionManagerStateFree;
  }
}

/*!
 iOS doesn't provide us an update block from UIView animation,
 we had to use a spring animation equation from
 https://medium.com/@dtinth/spring-animation-in-css-2039de6e1a03
 */
- (double)springAnimationFactorWithTimeElapsed:(CFTimeInterval)timeElapsed {
  return -exp2(-6.0*timeElapsed)/2.0 * (-2.0*exp2(6.0*timeElapsed) + sin(12.0*timeElapsed) + 2.0*cos(12.0*timeElapsed));
}

@end
