import React, { Component, useEffect, useState } from 'react';
import Image from 'next/image';
import { debounce } from 'lodash';
import { usePubNub } from 'pubnub-react';
import { useSwipeable } from 'react-swipeable';
import OtpInput from 'react-otp-input';
import otpGenerator from 'otp-generator';

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

const swipeConfig = {
  delta: 25, // min distance(px) before a swipe starts
  preventDefaultTouchmoveEvent: true, // preventDefault on touchmove, *See Details*
  trackTouch: true, // track touch input
  trackMouse: false, // track mouse input
  rotationAngle: 0 // set a rotation angle
};

const otpGeneratorConfig = { digits: true, alphabets: false, upperCase: false, specialChars: false }

const App = () => {
  const appElement = React.createRef();
  const [audio, setAudio] = useState();
  const [sensitivity, setSensitivity] = useState(0.3);
  const pubnub = usePubNub();
  const [channels] = useState(['']);
  const [channelCode, setChannelCode] = useState('');
  const [messages, addMessage] = useState([]);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const onSwipedUp = (eventData) => {
    setModalOpen(true)
    // console.log("User Swiped Up!!", eventData);
  }

  const onSwipedDown = (eventData) => {
    setModalOpen(false)
    // console.log("User Swiped Down!!", eventData);
  }

  const SwipeUpHandler = useSwipeable({
    onSwipedUp,
    ...swipeConfig,
  });

  const SwipeDownHandler = useSwipeable({
    onSwipedDown,
    ...swipeConfig,
  });
  
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
      // sendMessage({type: 'colorChange', hex})
    }
  }, 20, {
    leading: true,
  });

  const changeBgColor = (hex) => {
    if(appElement.current){
      appElement.current.style.backgroundColor = hex;
    }
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

  const handlePartyCode = (code) => {
    setChannelCode(code)
    console.log({code})
  };

  const getNewChannelCode = () => {
    const channel = otpGenerator.generate(6, otpGeneratorConfig);
    console.log({channel});
    return channel
  }

  const createParty = () => {
    const code = getNewChannelCode()
    setChannelCode(code);
  }

  useEffect(() => {
    getMicrophone();
  }, []);

  useEffect(() => {
    pubnub.addListener({ message: handleMessage });
    channelCode && pubnub.subscribe({ channels: [channelCode] });
  }, [pubnub, channelCode]);

  return (
    <div className={styles.App} ref={appElement}>
      {audio ? 
      <AudioAnalyser 
        audio={audio}
        sensitivity={sensitivity}
        cb={callbackHandler}
      /> 
      : null}

      <div {...SwipeUpHandler} className={styles.settings}>
        <span onClick={onSwipedUp} className={styles.swipeUpIcon}>&#8682;</span>
      </div>

      {
        modalOpen ? 
        <div className={styles.modalWrapper}>
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContainer} {...SwipeDownHandler}>
              <h3>Settings</h3>
              <div className={styles.controls}>
                <div className={styles.sensitivityWrapper}>
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
                </div>
                <button className={styles.micButton} onClick={toggleMicrophone}>
                  <Image src={audio ? '/images/mic-on.png' : '/images/mic-off.png'} width={32} height={32} alt="mic status" />
                  {/* {audio ? 'Stop microphone' : 'Allow microphone input'} */}
                </button>
              </div>

              <div className={styles.party}>
                {/* <OtpInput
                  value={channelCode}
                  onChange={handlePartyCode}
                  numInputs={6}
                  separator={<span></span>}
                  isDisabled={false}
                  isInputNum={true}
                  inputStyle={styles.otpInput}
                /> */}
                <div className={styles.buttonGroup}>
                  <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={createParty}>Create Party</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`}>Join Party</button>
                </div>
                {/* <div className={styles.buttonGroup}>
                  <button className={`${styles.btn} ${styles.btnError}`}>Leave Party</button>
                  <button className={`${styles.btn} ${styles.btnPrimary}`}>Invite  🎉</button>
                </div> */}
              </div>
            </div>
          </div>
        </div>
        : null
      }
    </div>
  );
}

export default App;
