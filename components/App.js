import React, { Component } from 'react';
import { debounce } from 'lodash';

import AudioAnalyser from '../utils/AudioAnalyser';
import { bgHEX } from '../config';

import styles from '../styles/App.module.css'

const getRandomColor = () => {
  const len = bgHEX.length;
  const randomIndex = Math.floor(Math.random() * 10 % len);
  const randomHex = bgHEX[randomIndex];
  // console.log({randomHex});
  return randomHex;
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: null,
      sensitivity: 0.3,
    };
    this.appElement = React.createRef();
    this.toggleMicrophone = this.toggleMicrophone.bind(this);
  }

  async getMicrophone() {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    this.setState({ audio });
  }

  stopMicrophone() {
    this.state.audio.getTracks().forEach(track => track.stop());
    this.setState({ audio: null });
  }

  toggleMicrophone() {
    if (this.state.audio) {
      this.stopMicrophone();
    } else {
      this.getMicrophone();
    }
  }

  componentDidMount() {
    this.getMicrophone();
  }

  callbackHandler = debounce((value) => {
    // console.log({diff: value, sensitivity: this.state.sensitivity})
    if(document.visibilityState === 'visible') {
      this.changeBgColor()
    }
  }, 20, {
    leading: true,
  });

  changeBgColor = () => {
    this.appElement.current.style.backgroundColor = getRandomColor();
  }

  handleSeekChange = e => {
    this.setState({sensitivity: parseFloat(e.target.value)});
  };

  render() {
    return (
      <div className={styles.App} ref={this.appElement}>
        <div className={styles.controls}>
          <input
            className={styles.sensitivity}
            type="range"
            min={0}
            max={0.999999}
            step="any"
            value={this.state.sensitivity}
            onChange={this.handleSeekChange}
            // onMouseDown={handleSeekMouseDown}
            // onMouseUp={handleSeekMouseUp}
          />
          <span>Sensitivity</span>
          {/* <button onClick={this.toggleMicrophone}>
            {this.state.audio ? 'Stop microphone' : 'Allow microphone input'}
          </button> */}
        </div>
        {this.state.audio ? 
        <AudioAnalyser 
          audio={this.state.audio}
          sensitivity={this.state.sensitivity}
          cb={this.callbackHandler}
        /> 
        : ''}
      </div>
    );
  }
}

export default App;
