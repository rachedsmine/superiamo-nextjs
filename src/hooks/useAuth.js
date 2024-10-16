// src/hooks/useAuth.js

import { useEffect, useState, useContext, createContext } from 'react';
import { auth } from '../lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const authData = useProvideAuth();
  return <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};

function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, firstName, lastName, phoneNumber, address) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber,
          address, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription.');
      }

      // L'utilisateur est automatiquement connecté via Firebase Auth grâce à la route API
      // Récupérer l'utilisateur actuel
      const currentUser = auth.currentUser;
      setUser(currentUser);

      return data;
    } catch (error) {
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
  };
}
