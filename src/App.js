import logo from './logo.svg';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

const firebaseConfig = require('../firebase_config.json');

firebase.initializeApp(firebaseConfig)

const auth = firebase.auth();
const firestore = firebase.firestore();

const [user] = useAuthState(auth);

function SignIn() {
    const signInWithGoogle = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider);
    }


    return (
        <button onClick={signInWithGoogle}>Entrar com o Google</button>
    )
}
function SignOut() {
    return auth.currentUser && (
        <button onClick={() => auth.signOut()}>Sair</button>
    )
}

function ChatMessage(props) {
    const {text, uid} = props.message;
    
    return <p>{text}</p>
}

function ChatRoom() {
    const messagesRef = firestore.collection("messages");
    const query = messagesRef.orderBy('createdAt').limit(25);

    const [messages] = useCollectionData(query, {idField: 'id'});


    return (
        <div>
            <div>
                {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
            </div>
            <div></div>
        </div>
    )

}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        
      </header>
      
      <section>
          { user ? <ChatRoom />: <SignIn />}
      </section>
    </div>
  );
}

export default App;
