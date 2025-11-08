import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Same Firebase configuration as main app
const firebaseConfig = {
    apiKey: "AIzaSyBZzn8kYUjqTo1-Wpu9vT4jZ9-UB2BDL4Y",
    authDomain: "e-responde.firebaseapp.com",
    databaseURL: "https://e-responde-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "e-responde",
    storageBucket: "e-responde.firebasestorage.app",
    messagingSenderId: "343953743058",
    appId: "1:343953743058:android:402d049aa2fd446be7e10b"
};

// Initialize Firebase (check for existing instances)
let app: any;
let auth: any;

try {
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('Smartwatch Firebase: App initialized successfully');
    } else {
        app = getApps()[0];
        console.log('Smartwatch Firebase: Using existing app instance');
    }
    
    // Initialize auth without AsyncStorage dependency
    auth = getAuth(app);
    console.log('Smartwatch Firebase: Auth initialized successfully');
} catch (error) {
    console.error('Smartwatch Firebase initialization error:', error);
    throw new Error('Firebase initialization failed');
}

export { auth };

// Initialize Firebase services with error handling
let database: any = null;
let storage: any = null;

try {
    // Only initialize if app is available
    if (app) {
        // Import and initialize database and storage only if needed
        const { getDatabase } = require('firebase/database');
        const { getStorage } = require('firebase/storage');
        
        database = getDatabase(app);
        storage = getStorage(app);
        console.log('Smartwatch Firebase: ✅ Database and storage initialized successfully');
        console.log('Smartwatch Firebase: Database URL:', database.app.options.databaseURL);
    } else {
        console.error('Smartwatch Firebase: ❌ App not initialized, cannot initialize database');
    }
} catch (error: any) {
    console.error('Smartwatch Firebase: ❌ Database/storage initialization failed:', error);
    console.error('Smartwatch Firebase: Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
    });
    // Continue without database/storage for minimal functionality
    // But log error so user knows
}

export { database, storage };
export default app;

