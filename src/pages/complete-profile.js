import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { firestore, auth, FieldValue } from '../lib/firebase'; 
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { motion } from 'framer-motion';

const validationSchema = Yup.object().shape({
  firstName: Yup.string().required('Prénom requis'),
  lastName: Yup.string().required('Nom requis'),
  phoneNumber: Yup.string()
    .required('Numéro de téléphone requis')
    .test('is-valid-phone', 'Numéro de téléphone invalide', (value) => {
      const phoneNumber = parsePhoneNumberFromString(value);
      return phoneNumber ? phoneNumber.isValid() : false;
    }),
  adress: Yup.string().required('Adresse requise'),
});

export default function CompleteProfile() {
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Vérification si le profil est déjà complet
        const userDoc = await firestore.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists && userDoc.data().firstName && userDoc.data().lastName) {
          router.push('/profile');
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adress: data.adress }),
      });

      const result = await response.json();
      console.log('Validation Address Response:', result);

      if (!response.ok) {
        setMessage(result.message || 'Adresse invalide');
        setLoading(false);
        return;
      }

      // Mise a jours des données dans Firestore
      const formattedPhoneNumber = parsePhoneNumberFromString(data.phoneNumber).number;
      console.log('Formatted Phone Number:', formattedPhoneNumber);

      await firestore.collection('users').doc(user.uid).set({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: formattedPhoneNumber,
        adress: data.adress,
        updatedAt: FieldValue.serverTimestamp(), 
      }, { merge: true });

      setMessage('Profil complété avec succès.');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la complétion du profil:', error);
      setMessage('Erreur lors de la complétion du profil.');
    }
    setLoading(false);
  };

  if (!user) return <div>Chargement...</div>;

  return (
    <motion.div
      className="min-h-screen bg-gray-100 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Complétez Votre Profil</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Champ Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              name="firstName"
              {...register('firstName')}
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
              className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${errors.adress ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
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
            <div className={`mt-4 text-center text-sm ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          {/* Bouton d'action */}
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading ? 'bg-indigo-300' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
