import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD7kFJeg5ipcE0f5K5hiicQzF6sTiMgMis",
  authDomain: "toprentbill.firebaseapp.com",
  projectId: "toprentbill",
  storageBucket: "toprentbill.firebasestorage.app",
  messagingSenderId: "753270273793",
  appId: "1:753270273793:web:535f921bb0af273ddecd00",
  measurementId: "G-R0EVLQNH7Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'manager01@toprent.app';
const password = 'Admin123!';

async function ensureAdminUser() {
  if (!auth || !db) {
    throw new Error('Firebase is not properly initialized');
  }

  try {
    // Try to sign in first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Check if user document exists and has admin role
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        // Create admin document if it doesn't exist
        await setDoc(doc(db, 'users', uid), {
          email,
          name: 'Admin',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Admin user document created');
      }
      
      console.log('Admin user already exists and is configured correctly');
      return uid;
    } catch (signInError) {
      // If sign in fails, try to create new user
      if (signInError.code === 'auth/user-not-found') {
        const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = newUserCredential.user.uid;

        // Create admin user document
        await setDoc(doc(db, 'users', uid), {
          email,
          name: 'Admin',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('New admin user created successfully');
        return uid;
      } else {
        throw signInError;
      }
    }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Please use the login page to access the system.');
      return null;
    }
    throw error;
  }
}

ensureAdminUser()
  .then((uid) => {
    if (uid) {
      console.log('Setup completed successfully');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });