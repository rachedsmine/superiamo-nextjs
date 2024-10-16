// hooks/useGithubAuth.js

import { useState } from 'react';
import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, firestore } from '../lib/firebase'; 
import { useRouter } from 'next/router';

const useGithubAuth = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (provider === 'github') {
        const githubProvider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, githubProvider);
        
        // Récupérer les informations de l'utilisateur
        const user = result.user;

        // Vérifier si l'utilisateur existe déjà dans Firestore
        const userDoc = await firestore.collection('users').doc(user.uid).get();
        if (!userDoc.exists) {
          // Si l'utilisateur n'existe pas, créez-le
          await firestore.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ')[1] || '',
            phoneNumber: '', // Vous pouvez demander cette information ultérieurement
            address: '', // Correction de 'adress' à 'address'
            createdAt: new Date(),
            emailVerified: user.emailVerified,
            githubProvider: true, // Indique que l'utilisateur s'est inscrit via GitHub
          });
        }

        setSuccessMessage('Connexion réussie via GitHub !');
        setTimeout(() => {
          router.push('/complete-profile'); // Redirigez l'utilisateur vers le tableau de bord ou une autre page
        }, 2000);
      }
      console.log('Connexion réussie avec', provider);
    } catch (error) {
      console.error(`Erreur lors de la connexion avec ${provider}:`, error);
      let message = 'Une erreur est survenue lors de la connexion via GitHub.';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'La fenêtre de connexion a été fermée avant d\'avoir terminé.';
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return { handleSocialLogin, loading, errorMessage, successMessage };
};

export default useGithubAuth;
