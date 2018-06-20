import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  StyleSheet,
  requireNativeComponent,
  NativeModules,
  View,
  ViewPropTypes,
  Image
} from "react-native";
import resolveAssetSource
  from "react-native/Libraries/Image/resolveAssetSource";
import TextTrackType from "./TextTrackType";
import VideoResizeMode from "./VideoResizeMode.js";

const styles = StyleSheet.create({
  base: {
    overflow: "hidden"
  }
});

export { TextTrackType };

export default class Video extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showPoster: true
    };
  }

  setNativeProps(nativeProps) {
    this._root.setNativeProps(nativeProps);
  }

  seek = time => {
    this.setNativeProps({ seek: time });
  };

  presentFullscreenPlayer = () => {
    this.setNativeProps({ fullscreen: true });
  };

  dismissFullscreenPlayer = () => {
    this.setNativeProps({ fullscreen: false });
  };

  _assignRoot = component => {
    this._root = component;
  };

  _onLoadStart = event => {
    if (this.props.onLoadStart) {
      this.props.onLoadStart(event.nativeEvent);
    }
  };

  _onLoad = event => {
    if (this.props.onLoad) {
      this.props.onLoad(event.nativeEvent);
    }
  };

  _onError = event => {
    if (this.props.onError) {
      this.props.onError(event.nativeEvent);
    }
  };

  _onProgress = event => {
    if (this.props.onProgress) {
      this.props.onProgress(event.nativeEvent);
    }
  };

  _onSeek = event => {
    if (this.state.showPoster) {
      this.setState({ showPoster: false });
    }

    if (this.props.onSeek) {
      this.props.onSeek(event.nativeEvent);
    }
  };

  _onEnd = event => {
    if (this.props.onEnd) {
      this.props.onEnd(event.nativeEvent);
    }
  };

  _onTimedMetadata = event => {
    if (this.props.onTimedMetadata) {
      this.props.onTimedMetadata(event.nativeEvent);
    }
  };

  _onFullscreenPlayerWillPresent = event => {
    if (this.props.onFullscreenPlayerWillPresent) {
      this.props.onFullscreenPlayerWillPresent(event.nativeEvent);
    }
  };

  _onFullscreenPlayerDidPresent = event => {
    if (this.props.onFullscreenPlayerDidPresent) {
      this.props.onFullscreenPlayerDidPresent(event.nativeEvent);
    }
  };

  _onFullscreenPlayerWillDismiss = event => {
    if (this.props.onFullscreenPlayerWillDismiss) {
      this.props.onFullscreenPlayerWillDismiss(event.nativeEvent);
    }
  };

  _onFullscreenPlayerDidDismiss = event => {
    if (this.props.onFullscreenPlayerDidDismiss) {
      this.props.onFullscreenPlayerDidDismiss(event.nativeEvent);
    }
  };

  _onReadyForDisplay = event => {
    if (this.props.onReadyForDisplay) {
      this.props.onReadyForDisplay(event.nativeEvent);
    }
  };

  _onPlaybackStalled = event => {
    if (this.props.onPlaybackStalled) {
      this.props.onPlaybackStalled(event.nativeEvent);
    }
  };

  _onPlaybackResume = event => {
    if (this.props.onPlaybackResume) {
      this.props.onPlaybackResume(event.nativeEvent);
    }
  };

  _onPlaybackRateChange = event => {
    if (this.state.showPoster && event.nativeEvent.playbackRate !== 0) {
      this.setState({ showPoster: false });
    }

    if (this.props.onPlaybackRateChange) {
      this.props.onPlaybackRateChange(event.nativeEvent);
    }
  };

  _onAudioBecomingNoisy = () => {
    if (this.props.onAudioBecomingNoisy) {
      this.props.onAudioBecomingNoisy();
    }
  };

  _onAudioFocusChanged = event => {
    if (this.props.onAudioFocusChanged) {
      this.props.onAudioFocusChanged(event.nativeEvent);
    }
  };

  _onBuffer = event => {
    if (this.props.onBuffer) {
      this.props.onBuffer(event.nativeEvent);
    }
  };

  render() {
    const resizeMode = this.props.resizeMode;
    const source = resolveAssetSource(this.props.source) || {};

    let uri = source.uri || "";
    if (uri && uri.match(/^\//)) {
      uri = `file://${uri}`;
    }

    const isNetwork = !!(uri && uri.match(/^https?:/));
    const isAsset = !!(uri &&
      uri.match(/^(assets-library|file|content|ms-appx|ms-appdata):/));

    let nativeResizeMode;
    if (resizeMode === VideoResizeMode.stretch) {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleToFill;
    } else if (resizeMode === VideoResizeMode.contain) {
      nativeResizeMode =
        NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFit;
    } else if (resizeMode === VideoResizeMode.cover) {
      nativeResizeMode =
        NativeModules.UIManager.RCTVideo.Constants.ScaleAspectFill;
    } else {
      nativeResizeMode = NativeModules.UIManager.RCTVideo.Constants.ScaleNone;
    }

    const nativeProps = Object.assign({}, this.props);
    Object.assign(nativeProps, {
      style: [styles.base, nativeProps.style],
      resizeMode: nativeResizeMode,
      src: {
        uri,
        isNetwork,
        isAsset,
        type: source.type || "",
        mainVer: source.mainVer || 0,
        patchVer: source.patchVer || 0
      },
      onVideoLoadStart: this._onLoadStart,
      onVideoLoad: this._onLoad,
      onVideoError: this._onError,
      onVideoProgress: this._onProgress,
      onVideoSeek: this._onSeek,
      onVideoEnd: this._onEnd,
      onVideoBuffer: this._onBuffer,
      onTimedMetadata: this._onTimedMetadata,
      onVideoFullscreenPlayerWillPresent: this._onFullscreenPlayerWillPresent,
      onVideoFullscreenPlayerDidPresent: this._onFullscreenPlayerDidPresent,
      onVideoFullscreenPlayerWillDismiss: this._onFullscreenPlayerWillDismiss,
      onVideoFullscreenPlayerDidDismiss: this._onFullscreenPlayerDidDismiss,
      onReadyForDisplay: this._onReadyForDisplay,
      onPlaybackStalled: this._onPlaybackStalled,
      onPlaybackResume: this._onPlaybackResume,
      onPlaybackRateChange: this._onPlaybackRateChange,
      onAudioFocusChanged: this._onAudioFocusChanged,
      onAudioBecomingNoisy: this._onAudioBecomingNoisy
    });

    if (this.props.poster && this.state.showPoster) {
      const posterStyle = {
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        resizeMode: this.props.posterResizeMode || "contain"
      };

      return (
        <View style={nativeProps.style}>
          <RCTVideo ref={this._assignRoot} {...nativeProps} />
          <Image style={posterStyle} source={{ uri: this.props.poster }} />
        </View>
      );
    }

    return <RCTVideo ref={this._assignRoot} {...nativeProps} />;
  }
}

Video.propTypes = {
  /* Native only */
  src: PropTypes.object,
  seek: PropTypes.number,
  fullscreen: PropTypes.bool,
  onVideoLoadStart: PropTypes.func,
  onVideoLoad: PropTypes.func,
  onVideoBuffer: PropTypes.func,
  onVideoError: PropTypes.func,
  onVideoProgress: PropTypes.func,
  onVideoSeek: PropTypes.func,
  onVideoEnd: PropTypes.func,
  onTimedMetadata: PropTypes.func,
  onVideoFullscreenPlayerWillPresent: PropTypes.func,
  onVideoFullscreenPlayerDidPresent: PropTypes.func,
  onVideoFullscreenPlayerWillDismiss: PropTypes.func,
  onVideoFullscreenPlayerDidDismiss: PropTypes.func,

  /* Wrapper component */
  source: PropTypes.oneOfType([
    PropTypes.shape({
      uri: PropTypes.string
    }),
    // Opaque type returned by require('./video.mp4')
    PropTypes.number
  ]),
  resizeMode: PropTypes.string,
  poster: PropTypes.string,
  posterResizeMode: Image.propTypes.resizeMode,
  repeat: PropTypes.bool,
  allowsExternalPlayback: PropTypes.bool,
  selectedTextTrack: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  textTracks: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      uri: PropTypes.string.isRequired,
      type: PropTypes.oneOf([
        TextTrackType.SRT,
        TextTrackType.TTML,
        TextTrackType.VTT
      ]),
      language: PropTypes.string.isRequired
    })
  ),
  paused: PropTypes.bool,
  muted: PropTypes.bool,
  volume: PropTypes.number,
  stereoPan: PropTypes.number,
  rate: PropTypes.number,
  playInBackground: PropTypes.bool,
  playWhenInactive: PropTypes.bool,
  ignoreSilentSwitch: PropTypes.oneOf(["ignore", "obey"]),
  disableFocus: PropTypes.bool,
  controls: PropTypes.bool,
  currentTime: PropTypes.number,
  progressUpdateInterval: PropTypes.number,
  useTextureView: PropTypes.bool,
  onLoadStart: PropTypes.func,
  onLoad: PropTypes.func,
  onBuffer: PropTypes.func,
  onError: PropTypes.func,
  onProgress: PropTypes.func,
  onSeek: PropTypes.func,
  onEnd: PropTypes.func,
  onFullscreenPlayerWillPresent: PropTypes.func,
  onFullscreenPlayerDidPresent: PropTypes.func,
  onFullscreenPlayerWillDismiss: PropTypes.func,
  onFullscreenPlayerDidDismiss: PropTypes.func,
  onReadyForDisplay: PropTypes.func,
  onPlaybackStalled: PropTypes.func,
  onPlaybackResume: PropTypes.func,
  onPlaybackRateChange: PropTypes.func,
  onAudioFocusChanged: PropTypes.func,
  onAudioBecomingNoisy: PropTypes.func,
  textTracks: PropTypes.array,
  drmUrl: PropTypes.string,
  /* Required by react-native */
  scaleX: PropTypes.number,
  scaleY: PropTypes.number,
  translateX: PropTypes.number,
  translateY: PropTypes.number,
  rotation: PropTypes.number,
  ...ViewPropTypes
};

const RCTVideo = requireNativeComponent("RCTVideo", Video, {
  nativeOnly: {
    src: true,
    seek: true,
    fullscreen: true
  }
});
