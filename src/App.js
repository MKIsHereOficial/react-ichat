import './App.css';
import './message.css';
import './root.css';

//import styled from 'styled-components';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import regularIcons from '@fortawesome/free-regular-svg-icons';
import * as solidIcons from '@fortawesome/free-solid-svg-icons';


import {Twemoji} from 'react-emoji-render';

import React, { useState, useRef } from 'react';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = require('./firebase_config.json');

const app = firebase.initializeApp(firebaseConfig);

const auth = firebase.auth(app);
const firestore = firebase.firestore(app);

let isBanned = false;


function SignIn() {
    const signInWithGoogle = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithRedirect(provider);
    }

    //const [email, setEmail] = useState("");
    //const [pass, setPass] = useState("");

    return (
        <div className="SignIn">
            <div><FontAwesomeIcon icon={solidIcons.faPlus} size="10x" color="white" spin /></div>
            <button className="SIGoogle" onClick={signInWithGoogle}>Entrar com o Google</button>
        </div>
    )
}
function SignOut() {
    return auth.currentUser && (
        <button onClick={() => auth.signOut()}>Sair</button>
    )
}

function ChatMessage(props) {
    let { text, uid, photoURL, displayName, createdAt } = props["message"];
    const messageID = props["key"];
    const doc = props["message"];

    const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

    let timestamp = (createdAt != null && createdAt.toDate) ? createdAt.toDate() : false;
    if (timestamp) {
        timestamp = {
            day: (async => {
                let idx = timestamp.getDay();
                let days = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
                return days[idx];
            })(),
            date: timestamp.getDate(),
            year: timestamp.getFullYear(),
            month: (async => {
                let idx = timestamp.getMonth();
                let months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                return months[idx];
            })(),
            hours: (async => {
                let h = "" + timestamp.getHours();
                h = h.length < 2 ? "0" + h : h;
                return h;
            })(),
            minutes: (async => {
                let h = "" + timestamp.getMinutes();
                h = h.length < 2 ? "0" + h : h;
                return h;
            })(),
            seconds: (async => {
                let h = "" + timestamp.getSeconds();
                h = h.length < 2 ? "0" + h : h;
                return h;
            })()
        }
    }

    let time = (timestamp && timestamp.hours && timestamp.minutes && timestamp.seconds) ? `${timestamp.hours}:${timestamp.minutes}:${timestamp.seconds}` : false;
    if (time) {
        time = time.split("");
        let ex = 3;
        for (let i = 0; i < ex; i++) {
            time.pop();
        }

        time = time.join("");
    }

    const Filter = require("bad-words");

    let badWordsRef = firestore.collection("banned_words");
    badWordsRef = badWordsRef.orderBy("word", "desc");
    let [badWords] = useCollectionData(badWordsRef, {idField: 'id'});
    if (!badWords || !badWords[0]) badWords = [];
    badWords = badWords.map(word => {
        return word.word;
    })

    async function detectEvilUser() {
        let filter = new Filter({ placeholder: '#' });
        // var words = require("naughty-words");

        filter.addWords(...badWords);

        if (filter.isProfane(text)) {
            const cleaned = filter.clean(text);

            console.log(cleaned);

            if (doc && doc.update) {
                await doc.update({ text: `${cleaned}`, originalText: text });
            } else {
                text = cleaned;
            }
            //await auth.signOut(); // Sair da conta.
        } else {
            if (doc && doc.update) {
                await doc.update({ text: `${text}`, originalText: text });
            }
        }
    }
    detectEvilUser();

    function showAvatar(e) {
        if (e && e.target) {
            let target = e.target;
            target.classList.toggle("clicked");
        }
    }
    function hideAvatar(e) {
        if (e && e.target) {
            e.target.parentElement.previousSibling.classList.toggle("clicked");
        }
    }

    let messageContent = useRef();

    if (messageContent && messageContent.current) {
        let onlyEmoji = messageContent.current.querySelector("span").classList[0] === "onlyEmoji";

        if (onlyEmoji) {
            messageContent.current.classList.add("onlyEmoji");
        }
    }

    console.log(`Rendering messages/${messageID} onto the Chatroom.`);

    return (
        <div className={`message ${messageClass}`}>
            <img onContextMenu={() => { return false; }} className="message-avatar" src={photoURL} alt={displayName} loading="lazy" title={displayName} onClick={(e) => showAvatar(e)} />
            <div className="message-avatar-clicked">
                <div className="bg" onClick={(e) => hideAvatar(e)}></div>
                <p>
                    <img src={photoURL} alt={displayName} onContextMenu={(e) => { e.preventDefault(); return false; }} draggable={false}/>
                    <h2>{displayName}</h2>
                    <h3>{`${timestamp.date} de ${timestamp.month} de ${timestamp.year}, às ${time + `:${timestamp.seconds}`}`}</h3>
                </p>
            </div>
            <p ref={messageContent} className="message-content"><Twemoji svg text={text} onlyEmojiClassName="onlyEmoji" options={{ext: 'svg', protocol:'https'}} /></p>
            {time ? <p className="message-timestamp" title={`${timestamp.date} de ${timestamp.month} de ${timestamp.year}, às ${time + `:${timestamp.seconds}`}`}>{time}</p> : ""}
        </div>
    )
}

function ChatRoom() {



    let usersRef = firestore.collection("users");
    let usersQuery = usersRef.orderBy("createdAt", "desc");
    let [users] = useCollectionData(usersQuery, { idField: 'id' });
    setTimeout(() => {
        if (auth.currentUser && users) {
            let user = auth.currentUser;

            if (!users.find(u => u.uid === user.uid)) {
                if (usersRef.doc && usersRef.doc.toString()) {
                    console.log(usersRef.doc.toString())
                    usersRef.doc(user.uid).set({
                        avatarURL: user.photoURL,
                        displayName: user.displayName,
                        username: user.displayName,
                        uid: user.uid,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        }
    }, 1000)

    ///////////////////////
    const dummy = useRef();

    const messagesRef = firestore.collection("messages");
    const query = messagesRef.orderBy('createdAt').limitToLast(25);

    const [messages] = useCollectionData(query, { idField: 'id' });
    if (dummy && dummy.current) {
        dummy.current.scrollIntoView({ behavior: 'smooth' });
    }

    const [formValue, setFormValue] = useState("");
    const text = formValue;
    const sendMessage = async(e) => {
        e.preventDefault();

        if (!text || text.length <= 0) return;

        const { uid, photoURL, displayName } = auth.currentUser;

        let msgObj = {
            text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid,
            photoURL,
            displayName
        };

        if (users.find(u => u.uid === uid)) {
            if (usersRef.doc && usersRef.doc.toString()) {
                msgObj.user = usersRef.doc(uid);
            } else {
                msgObj.user = users.find(u => u.uid === uid);
            }
        } else {
            const user = auth.currentUser;
            let userObj = {
                avatarURL: user.photoURL,
                displayName: user.displayName,
                username: user.displayName,
                uid: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            }
            console.log(userObj, usersRef.doc)
            if (usersRef.doc && usersRef.doc.toString()) {
                console.log(usersRef.doc.toString())
                usersRef.doc(`${user.uid}`).set(userObj);
            } else {
                await usersRef.add(userObj);
            }
        }

        await messagesRef.add(msgObj);

        setFormValue("");

        if (dummy && dummy.current) {
            dummy.current.scrollIntoView({ behavior: 'smooth' });
        }
    }


    if (dummy && dummy.current) {
        dummy.current.scrollIntoView({ behavior: 'smooth' });
    }

    const form = useRef();

    const keyUp = (e) => {
        const key = e.key, isShift = e.shiftKey;
        const isEnter = key.toLowerCase() === "enter";

        if (isEnter && !isShift) {
            if (form.current && form.current.submit) {
                sendMessage({ preventDefault: () => { return null;}});
                setFormValue("");
            }
        }
    }

    let tVideo = useRef();

    function startAudioInput() {
        if (tVideo) {
            const hdConstraints = {
                video: { width: { min: 1280 }, height: { min: 720 } },
            };

            const video = tVideo.current.querySelector("video");

            navigator.mediaDevices.getUserMedia(hdConstraints).then((stream) => {
                video.srcObject = stream;
            });
        }
    }

    return (
        <div className="Chatroom">
            <main>
                {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

                <div id="dummy" ref={dummy}></div>
            </main>
            <form ref={form} onSubmit={sendMessage}>
                <textarea spellCheck={true} placeholder="Enviar mensagem..." name="message-sender" onKeyDown={(e) => keyUp(e)} value={formValue} onChange={(e) => setFormValue(e.target.value)} />
                <button type="submit">SEND</button>
            </form>
        </div>
    )

}

function SpeakButton() {
    return (
        <div hidden className="speak-btn-container">
            <button hidden className="speak-btn"><FontAwesomeIcon icon={solidIcons.faMicrophone} /></button>
        </div>
    )
}

function Lobby() {
    return (
        <div className="Lobby">
            <div className="Lobby-Left">
                <FontAwesomeIcon icon={solidIcons.faCircle} />
            </div>
            <div className="Lobby-Right">

            </div>
        </div>
    )
}

function App() {
    const [user] = useAuthState(auth);

    return (
        <div className="App">
            <header className="App-header">
                <SignOut />
                {user && false != false ? <SpeakButton /> : ""}
            </header>

            {isBanned ? <h3 className="banned-alert">Você foi banido(a).<br />Entre em contato com a moderação para poder recuperar sua conta.</h3> : ""}

            <section>
                {user ? <Lobby /> : !isBanned ? <SignIn /> : "" }
            </section>
        </div>
    );
}

export default App;
