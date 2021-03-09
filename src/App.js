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
    return (
        <button onClick={signInWithGoogle}>Entrar com o Google</button>
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
