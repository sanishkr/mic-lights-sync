import React, { Component, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { usePubNub } from 'pubnub-react';

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

const App = () => {
  const appElement = React.createRef();
  const [audio, setAudio] = useState();
  const [sensitivity, setSensitivity] = useState(0.3);
  const pubnub = usePubNub();
  const [channels] = useState(['awesome-channel']);
  const [messages, addMessage] = useState([]);
  const [message, setMessage] = useState('');

  const getMicrophone = async () => {
    const audio = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });
    setAudio(audio)
  }

  const stopMicrophone = () => {
    audio.getTracks().forEach(track => track.stop());
    setAudio(null)
  }

  const toggleMicrophone = () => {
    if (audio) {
      stopMicrophone();
    } else {
      getMicrophone();
    }
  }

  const callbackHandler = debounce((value) => {
    if(document.visibilityState === 'visible') {
      // console.log({diff: value, sensitivity: sensitivity})
      const hex = getRandomColor();
      changeBgColor(hex);
      sendMessage({type: 'colorChange', hex})
    }
  }, 20, {
    leading: true,
  });

  const changeBgColor = (hex) => {
    appElement.current.style.backgroundColor = hex;
  }

  const handleSeekChange = e => {
    setSensitivity(parseFloat(e.target.value))
  };

  const handleMessage = event => {
    console.log(event);
    const message = event.message;
    if (message.hasOwnProperty('type') && message.type === 'colorChange') {
      const hex = message.hex;
      console.log({hex});
      changeBgColor(hex);
      // addMessage(messages => [...messages, text]);
    }
  };

  const sendMessage = message => {
    if (message) {
      pubnub
        .publish({ channel: channels[0], message })
        .then(() => setMessage(''));
    }
  };

  useEffect(() => {
    getMicrophone();
  }, [])

  useEffect(() => {
    pubnub.addListener({ message: handleMessage });
    pubnub.subscribe({ channels });
  }, [pubnub, channels]);

  return (
    <div className={styles.App} ref={appElement}>
      <div className={styles.controls}>
        <input
          className={styles.sensitivity}
          type="range"
          min={0}
          max={0.999999}
          step="any"
          value={sensitivity}
          onChange={handleSeekChange}
          // onMouseDown={handleSeekMouseDown}
          // onMouseUp={handleSeekMouseUp}
        />
        <span>Sensitivity</span>
        {/* <button onClick={this.toggleMicrophone}>
          {this.state.audio ? 'Stop microphone' : 'Allow microphone input'}
        </button> */}
      </div>
      {audio ? 
      <AudioAnalyser 
        audio={audio}
        sensitivity={sensitivity}
        cb={callbackHandler}
      /> 
      : ''}
    </div>
  );
}

export default App;
