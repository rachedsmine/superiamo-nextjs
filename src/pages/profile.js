// src/pages/profile.js
import { useEffect, useState } from 'react';
import { auth, firestore, signOutUser } from '../lib/firebase';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

// Définir le schéma de validation avec Yup
const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('Prénom requis'),
  lastName: Yup.string().required('Nom requis'),
  phoneNumber: Yup.string().required('Numéro de téléphone requis'),
  adress: Yup.string().required('Adresse requise'),
});

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    adress: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Initialiser React Hook Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: userData,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await firestore.collection('users').doc(currentUser.uid).get();
          if (userDoc.exists) {
            setUserData(userDoc.data());
            reset(userDoc.data()); // mise à jour des valeurs du formulaire
          } else {
            // Si l'utilisateur n'a pas de profil, rediriger vers la complétion de profil
            router.push('/complete-profile');
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur :', error);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router, reset]);

  const onSubmit = async (data) => {
    setMessage('');

    try {
      // Valider l'adresse via l'API
      const response = await fetch('/api/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adress: data.adress }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || 'Adresse invalide');
        return;
      }

      // Mise à jour des données dans Firestore
      await firestore.collection('users').doc(user.uid).update(data);
      setMessage('Informations mises à jour avec succès.');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des données utilisateur :', error);
      setMessage('Erreur lors de la mise à jour des informations.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset(userData); 
    setMessage('');
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Profil Utilisateur</h1>
        
        {/* Formulaire de Profil */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {user.photoURL && (
            <div className="flex justify-center mb-4">
              <img src={user.photoURL} alt="Photo de profil" className="w-32 h-32 rounded-full" />
            </div>
          )}
          
          {/* Champ Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              name="firstName"
              {...register('firstName')}
              disabled={!isEditing}
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${isEditing ? 'border-indigo-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
          </div>

          {/* Champ Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              name="lastName"
              {...register('lastName')}
              disabled={!isEditing}
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${isEditing ? 'border-indigo-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
          </div>

          {/* Champ Numéro de Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Numéro de Téléphone</label>
            <input
              type="tel"
              name="phoneNumber"
              {...register('phoneNumber')}
              disabled={!isEditing}
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${isEditing ? 'border-indigo-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>}
          </div>

          {/* Champ Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input
              type="text"
              name="adress"
              {...register('adress')}
              disabled={!isEditing}
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${isEditing ? 'border-indigo-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            />
            {errors.adress && <p className="text-red-500 text-sm mt-1">{errors.adress.message}</p>}
          </div>

          {/* Champ Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none cursor-not-allowed"
            />
          </div>

          {message && (
            <div className="mt-4 text-center">
              <p className={`text-sm ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="mt-6 flex justify-between">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Modifier
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Annuler
                </button>
              </>
            )}
            <button
              type="button"
              onClick={signOutUser}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Se déconnecter
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
