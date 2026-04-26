import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const firebaseConfig = config;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const getSecondaryAuth = (secondaryApp: any) => getAuth(secondaryApp);
export const createSecondaryUser = (secondaryAuth: Auth, email: string, pass: string) => 
  createUserWithEmailAndPassword(secondaryAuth, email, pass);

// Connectivity Test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
