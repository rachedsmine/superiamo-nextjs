import firebase from 'firebase/compat/app'; 
import 'firebase/compat/auth'; 
import 'firebase/compat/firestore'; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); 
}

// LES services Firebase
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const FieldValue = firebase.firestore.FieldValue;

/**
 * @param {firebase.User} user - Utilisateur Firebase
 * @param {Object} additionalData - Données supplémentaires à sauvegarder
 */
export const saveUserDataOnSignup = async (user, additionalData = {}) => {
  if (user) {
    const userRef = firestore.collection('users').doc(user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      firstName: additionalData.firstName || '',
      lastName: additionalData.lastName || '',
      phoneNumber: additionalData.phoneNumber || '',
      address: additionalData.address || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userData, { merge: true }); // Merge pour éviter d'écraser les données existantes
  }
};

 // Fonction pour la gestion de la connexion GitHub
export const githubSignIn = async () => {
  const provider = new firebase.auth.GithubAuthProvider();

  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    console.log('Utilisateur connecté via GitHub :', user);

    // Sauvegarde des données utilisateur dans Firestore
    await saveUserDataOnSignup(user);

    return user;
  } catch (error) {
    console.error('Erreur lors de la connexion GitHub :', error);
    throw error;
  }
};

/**
 * Fonction pour sauvegarder les données utilisateur après connexion avec email/mot de passe
 * @param {firebase.User} user - Utilisateur Firebase
 * @param {Object} additionalData - Données supplémentaires à sauvegarder
 */
export const saveUserDataToFirestore = async (user, additionalData = {}) => {
  if (user) {
    await saveUserDataOnSignup(user, additionalData);
  }
};

export const signOutUser = async () => {
  try {
    await auth.signOut();
    console.log('Utilisateur déconnecté');
  } catch (error) {
    console.error('Erreur lors de la déconnexion :', error);
  }
};

export default firebase;
