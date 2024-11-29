import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1Rd6CyxfAqfEiow32299K4mQ-lyJK_E4",
  authDomain: "gestione-abbonamenti.firebaseapp.com",
  projectId: "gestione-abbonamenti",
  storageBucket: "gestione-abbonamenti.firebasestorage.app",
  messagingSenderId: "819255097257",
  appId: "1:819255097257:web:568b03cc9b6d632939f6b8",
  measurementId: "G-612EWW089C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'demo123';

const setupAdmin = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, 'users', uid), {
      email: ADMIN_EMAIL,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('Admin user created successfully');
    console.log('Email:', ADMIN_EMAIL);
    console.log('Password:', ADMIN_PASSWORD);
    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists. Please use these credentials to login:');
      console.log('Email:', ADMIN_EMAIL);
      console.log('Password:', ADMIN_PASSWORD);
      process.exit(0);
    } else {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  }
};

setupAdmin();