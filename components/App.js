import React, { Component, useEffect, useState } from 'react';
import Image from 'next/image';
import { debounce } from 'lodash';
import { usePubNub } from 'pubnub-react';
import { useSwipeable } from 'react-swipeable';
import OtpInput from 'react-otp-input';
import otpGenerator from 'otp-generator';
import { parseCookies, setCookie, destroyCookie } from "nookies";
import { useToasts } from 'react-toast-notifications';

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

const cookieConfig = {
  maxAge: 30 * 24 * 60 * 60,
  path: "/"
};

const otpGeneratorConfig = { digits: true, alphabets: false, upperCase: false, specialChars: false }

const App = () => {
  const appElement = React.createRef();
  const cookies = parseCookies();
  const [audio, setAudio] = useState();
  const [sensitivity, setSensitivity] = useState(parseFloat(cookies.sensitivity) || 0.3);
  const pubnub = usePubNub();
  const [channels] = useState(['']);
  const [channelCode, setChannelCode] = useState(parseFloat(cookies.channel) || '');
  const [joiningMode, setJoiningMode] = useState(false);
  const [isPublisher, setIsPublisher] = useState(cookies.isPublisher ? JSON.parse(cookies.isPublisher) : true);
  const [partyCode, setPartyCode] = useState();
  const [messages, addMessage] = useState([]);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { addToast } = useToasts();

  // console.table({ cookies });

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
      channelCode && sendMessage({type: 'colorChange', hex})
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
    const s = parseFloat(e.target.value).toFixed(2)
    setCookie(null, "sensitivity", s, cookieConfig);
    setSensitivity(s)
  };

  const handleMessage = event => {
    console.log(event);
    checkIfPublisher(event);
    const message = event.message;
    if (message.hasOwnProperty('type') && message.type === 'colorChange') {
      const hex = message.hex;
      console.log({hex});
      changeBgColor(hex);
      // addMessage(messages => [...messages, text]);
    } else if (message.hasOwnProperty('type') && message.type === 'join') {
      const uuid = message.uuid;
      console.log({uuid});
      addToast('Someone joined the party.', { appearance: 'info', autoDismiss: true, autoDismissTimeout: 2000 });
    } else if (message.hasOwnProperty('type') && message.type === 'leave') {
      const uuid = message.uuid;
      addToast('Someone left the party.', { appearance: 'error', autoDismiss: true, autoDismissTimeout: 2000 });
      console.log({uuid});
    }
  };

  const checkIfPublisher = (event) => {
    const uuid = localStorage.getItem('uuid')
    console.log(event.publisher, uuid);
    console.log(event.publisher !== uuid);
    if(event.publisher !== uuid) {
      setIsPublisher(false);
      setCookie(null, "isPublisher", false, cookieConfig);
    }
  }

  const sendMessage = message => {
    if (message) {
      pubnub
        .publish({ channel: channelCode, message })
        .then(() => setMessage(''));
    }
  };

  const handlePartyCode = (code) => {
    setPartyCode(code.toString())
    if(code.length === 6) {
      setChannelCode(code, () => {
        sendMessage({type: 'join', uuid: localStorage.getItem('uuid')})
      })
      setCookie(null, "channel", code, cookieConfig);
      setJoiningMode(false)
    }
    console.log({code})
  };

  const getNewChannelCode = () => {
    const channel = otpGenerator.generate(6, otpGeneratorConfig);
    console.log({channel});
    return channel
  }

  const createParty = () => {
    const code = getNewChannelCode().toString()
    setChannelCode(code);
    setCookie(null, "channel", code, cookieConfig);
  }

  useEffect(() => {
    getMicrophone();
  }, []);

  useEffect(() => {
    pubnub.addListener({ message: handleMessage });
    channelCode && channelCode.length === 6 && pubnub.subscribe({ channels: [channelCode] });
  }, [pubnub, channelCode]);

  return (
    <div className={styles.App} ref={appElement}>
      {audio && isPublisher ? 
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
              {
                isPublisher ? 
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
                : null
              }

              <div className={styles.party}>
                {
                  channelCode || joiningMode ?
                  <OtpInput
                    value={joiningMode ? partyCode : channelCode}
                    onChange={handlePartyCode}
                    numInputs={6}
                    separator={<span></span>}
                    isDisabled={!joiningMode}
                    isInputNum={true}
                    inputStyle={styles.otpInput}
                  />
                  : null
                }
                {
                  joiningMode ?
                  <div className={styles.buttonGroup}>
                    {/* <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => {
                    setJoiningMode(true);
                    setAudio(false);
                    setIsPublisher(false);
                    toggleMicrophone()
                    }}>Join Party 🎉</button> */}
                  </div>
                  :
                  channelCode ?
                  <div className={styles.buttonGroup}>
                    <button className={`${styles.btn} ${styles.btnError}`}>Leave Party</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>Invite  🎉</button>
                  </div>
                  :
                  <div className={styles.buttonGroup}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={createParty}>Create Party</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => {
                    setJoiningMode(true);
                    setAudio(false);
                    setIsPublisher(false);
                    toggleMicrophone()
                    }}>Join Party</button>
                  </div>
                }
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
