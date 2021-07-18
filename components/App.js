import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { debounce } from 'lodash';
import { usePubNub } from 'pubnub-react';
import { useSwipeable } from 'react-swipeable';
import OtpInput from 'react-otp-input';
import otpGenerator from 'otp-generator';
import { parseCookies, setCookie, destroyCookie } from "nookies";
import NoSleep from 'nosleep.js';
import toast from 'react-hot-toast';

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

/**
 *  To literally get any random hex color code
 **/
// const getRandomColor = () => {
//   const letters = '0123456789ABCDEF'.split('');
//   let color = '#';
//   for (let i = 0; i < 6; i++) {
//     color += letters[Math.floor(Math.random() * 16)];
//   }
//   return color;
// };

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

const addToast = debounce((msg, { icon='🎉', appearance='success', autoDismiss=true, autoDismissTimeout=2000 }) => {
  toast((t) => (
    <span>{msg} <a onClick={() => toast.dismiss(t.id)}>&nbsp; &#10005;</a></span>), {
    position: 'top-center',
    duration: !autoDismiss ? Infinity : autoDismissTimeout,
    style: {
      backgroundColor: '#000000bf',
      color: '#c3c3c3',
      fontSize: '0.75rem',
      padding: '0.5rem',
      paddingRight: '1rem',
      paddingLeft: '1rem',
      borderRadius: '50px',
    },
    icon,
  });
}, 2000, {
  leading: true,
  trailing: false,
});

const otpGeneratorConfig = { digits: true, alphabets: false, upperCase: false, specialChars: false }

const App = () => {
  const noSleep = new NoSleep();
  const appElement = React.createRef();
  const cookies = parseCookies();
  const [audio, setAudio] = useState();
  const [sensitivity, setSensitivity] = useState(parseFloat(cookies.sensitivity) || 0.3);
  const pubnub = usePubNub();
  const [channelCode, setChannelCode] = useState(cookies.channel || '');
  const [joiningMode, setJoiningMode] = useState(false);
  const [isPublisher, setIsPublisher] = useState(cookies.isPublisher ? JSON.parse(cookies.isPublisher) : true);
  const [partyCode, setPartyCode] = useState();
  const [modalOpen, setModalOpen] = useState(false);
  const [canShare, setcanShare] = useState(false);
  const [copyText, setCopyText] = useState('Copy');
  const [micPermissionState, setMicPermissionState] = useState();

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
    // audio.then(function(permissionStatus){    
    //   console.log(permissionStatus); // granted, denied, prompt
    //   permissionStatus.onchange = function(){
    //       console.log("Mic Permission changed to " + this.state);
    //       setMicPermissionState(this.state);
    //   }
    // }).catch((err) => {
    //   console.log(`${err.name} : ${err.message}`)
    // });

    const micStatus = await navigator.permissions.query(
        { name: 'microphone' }
    ).then(function(permissionStatus){    
        // console.log(permissionStatus.state); // granted, denied, prompt
        setMicPermissionState(permissionStatus.state);
        permissionStatus.onchange = function(){
            // console.log("Mic Permission changed to " + this.state);
            setMicPermissionState(this.state);
        }
    }).catch((err) => {
      console.log(`${err.name} : ${err.message}`)
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
    document.querySelector('meta[name="theme-color"]').setAttribute('content',  hex)
    if(appElement?.current){
      appElement.current.style.backgroundColor = hex;
    } else {
      const el = document.getElementById('bgEl');
      el.style.backgroundColor = hex;
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
      console.log({joined: uuid});
      addToast('Someone joined the party.', { icon: '👋', appearance: 'info', autoDismiss: true, autoDismissTimeout: 2000 })
    } else if (message.hasOwnProperty('type') && message.type === 'leave') {
      const uuid = message.uuid;
      if(uuid === localStorage.getItem('uuid')) {
        addToast('You left the party.', { icon: '🚶🚪', appearance: 'error', autoDismiss: true, autoDismissTimeout: 2000 });
      } else {
        addToast('Someone left the party.', { icon: '🚶🚪', appearance: 'error', autoDismiss: true, autoDismissTimeout: 2000 });
      }
      console.log({left: uuid});
    } else if (message.hasOwnProperty('type') && message.type === 'over') {
      const uuid = message.uuid;
      addToast('Host ended party. Solo mode on!', { appearance: 'error', autoDismiss: false});
      changeBgColor('#FFFFFF');
      leaveParty({hasAdmin: true})
      console.log({uuid});
    }
  };

  const checkIfPublisher = (event) => {
    const uuid = localStorage.getItem('uuid')
    console.log(event.publisher, uuid);
    console.log(event.publisher !== uuid);
    if(event.publisher !== uuid && event.message.type !== 'leave') {
      setIsPublisher(false);
      setCookie(null, "isPublisher", false, cookieConfig);
    }
  }

  const sendMessage = message => {
    if (message) {
      pubnub
        .publish({ channel: channelCode, message })
    }
  };

  const handlePartyCode = (code) => {
    setPartyCode(code.toString())
    console.log({code})
  };

  const joinParty = async () => {
    if(partyCode.length === 6) {
      await pubnub.subscribe({ channels: [channelCode], withPresence: true, });
      // ToDo - Join msg after member subscribes needs fixing
      // setTimeout(async () => {
      //   await sendMessage({type: 'join', uuid: localStorage.getItem('uuid')})
      // }, 2000);
      setChannelCode(partyCode)
      setCookie(null, "channel", partyCode, cookieConfig);
      setJoiningMode(false)
      setPartyCode('')
      setAudio(false);
      setIsPublisher(false);
      setCookie(null, "isPublisher", false, cookieConfig);
      toggleMicrophone();
    }
    console.log({partyCode})
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
    addToast('Party Hosted. Invite friends!!', { icon: '🥳', appearance: 'success', autoDismiss: true, autoDismissTimeout: 2000 });
  }

  const leaveParty = async ({hasAdmin = false}) => {
    console.log({hasAdmin, isPublisher});
    if(!hasAdmin) {
      if(!isPublisher) {
        toggleMicrophone();
        await sendMessage({type: 'leave', uuid: localStorage.getItem('uuid')})
      } else {
        await sendMessage({type: 'over', uuid: localStorage.getItem('uuid')})
      }
    }
    setTimeout(async () => {
      await pubnub.unsubscribe({ channels: [channelCode] })
    }, 500);
    changeBgColor('#FFFFFF');
    destroyCookie(null, "channel");
    destroyCookie(null, "isPublisher");
    setChannelCode('')
    setIsPublisher(true)
  }

  const shareInvite = () => {
    if (canShare) {
      navigator
        .share({
          title: `Rave Party At Colorizer`,
          text: `Hey!! Join me in the party using this code ${channelCode}. Let's Vibe together 🤟`,
          url: `${document.location.href}`
        })
        .then(() => console.log('Successful share'))
        .catch(error => console.log('Error sharing', error));
    }
  };

  const copyToClipboard = () => {
    window.navigator.clipboard
      .writeText(channelCode)
      .then(res => {
        addToast('Code Copied to Clipboard', { icon: '📋', appearance: 'success', autoDismiss: true, autoDismissTimeout: 2000 });
        setCopyText('Copied');
        setTimeout(() => {
          setCopyText('Copy')
        }, 2000)
      })
      .catch(err => {
        console.log(err);
      });
  };

  useEffect(() => {
    getMicrophone();
    setcanShare(!!(navigator.share));
    noSleep.enable()
  }, []);

  useEffect(() => {
    pubnub.addListener({ message: handleMessage });
    channelCode && channelCode.length === 6 && pubnub.subscribe({ channels: [channelCode] });
  }, [pubnub, channelCode]);

  return (
    <div className={styles.App} id="bgEl" ref={appElement}>
      <div className={`${styles.a2hsContainer} ad2hs-prompt`}>
        <Image src="/images/a2hs.png" alt="a2hs" width="32" height="32" />
      </div>
      {audio && isPublisher ? 
      <AudioAnalyser 
        audio={audio}
        sensitivity={sensitivity}
        cb={callbackHandler}
      /> 
      : null}
      {
        !micPermissionState ?
        <div className={styles.micDisabled}>
          Please allow microphone access. This app needs it to work.
          <Image width="320" height="300" src="/images/sad-kitty.gif" alt="mic disabled" />
        </div>
        : null
      }

      <div {...SwipeUpHandler} className={styles.settings}>
        <span onClick={onSwipedUp} className={styles.swipeUpIcon}>&#8682;</span>
      </div>

      {
        modalOpen ? 
        <div className={styles.modalWrapper}>
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContainer} {...SwipeDownHandler}>
              <div className={styles.modalHeader}>
                <h3>Settings</h3>
                <a onClick={() => setModalOpen(false)}><span>&#10005;</span></a>
              </div>
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
                    <button className={`${styles.btn} ${styles.btnError}`} onClick={() => {
                      setPartyCode('');
                      setJoiningMode(false);
                    }}>Cancel</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={joinParty} disabled={(partyCode?.length ?? '') < 6}>Enter Now 🎉</button>
                  </div>
                  :
                  channelCode ?
                  <div className={styles.buttonGroup}>
                    <button className={`${styles.btn} ${styles.btnError}`} onClick={leaveParty}>🚶🚪Leave Party</button>
                    {
                      canShare ?
                      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={shareInvite}>Invite  🎉</button>
                      : <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={copyToClipboard}>{copyText} Code 📋</button>
                    }
                  </div>
                  :
                  <div className={styles.buttonGroup}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={createParty}>Host Party</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setJoiningMode(true)}>Join Party</button>
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
