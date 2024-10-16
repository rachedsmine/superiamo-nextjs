import { useState } from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa'; 
import { motion } from 'framer-motion';
import { useRouter } from 'next/router'; 
import { auth, firestore } from '../lib/firebase'; 
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import useGithubAuth from '../hooks/useGithubAuth'; 

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingSignup, setLoadingSignup] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const router = useRouter();

  const { handleSocialLogin, loading: loadingGithub, errorMessage: githubError, successMessage: githubSuccess } = useGithubAuth();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async () => {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber, address } = formData;
  
    // Validation des champs
    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }
  
    if (!address) {
      setErrorMessage('L\'adresse est requise.');
      return;
    }
  
    // Validation du format du numéro de téléphone
    const phoneNumberObj = parsePhoneNumberFromString(phoneNumber, 'FR');
    if (!phoneNumberObj || !phoneNumberObj.isValid()) {
      setErrorMessage('Numéro de téléphone invalide. Utilisez le format E.164, par exemple +33612345678.');
      return;
    }
  
    setLoadingSignup(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validation de l'adresse via l'API
    setLoadingAddress(true);
    try {
      const response = await fetch('/api/validate-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }), 
      });

      const result = await response.json();
      console.log('Validation Address Response:', result);

      if (!response.ok) {
        setErrorMessage(result.message || 'L\'adresse doit être située à moins de 50 km de Paris.');
        setLoadingAddress(false);
        setLoadingSignup(false);
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la validation de l\'adresse:', error);
      setErrorMessage('Erreur lors de la validation de l\'adresse.');
      setLoadingAddress(false);
      setLoadingSignup(false);
      return;
    }
    setLoadingAddress(false);

    // Création de l'utilisateur avec Firebase Auth
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Envoi de l'email de vérification
      await sendEmailVerification(user);

      // Enregistrement des informations utilisateur dans Firestore
      await firestore.collection('users').doc(user.uid).set({
        uid: user.uid,
        email,
        firstName,
        lastName,
        phoneNumber: phoneNumberObj.number,
        address,
        createdAt: new Date(),
        emailVerified: false,
      });

      setSuccessMessage('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        address: '',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      setErrorMessage(error.message);
    }

    setLoadingSignup(false);
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créez votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Bouton de connexion GitHub */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleSocialLogin('github')}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loadingGithub || loadingSignup}
            >
              <FaGithub className="w-5 h-5 mr-2" />
              GitHub
            </button>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OU</span>
            </div>
          </div>

          {/* Formulaire d'inscription */}
          <div className="space-y-4">
            {/* Champ Prénom */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Nom */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Numéro de Téléphone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Numéro de Téléphone (Format E.164)
              </label>
              <div className="mt-1">
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  autoComplete="tel"
                  required
                  pattern="^\+\d{10,15}$" // Validation du format E.164
                  title="Le numéro doit être au format E.164, par exemple +33612345678"
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="+33612345678"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Adresse */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <div className="mt-1">
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="123 Rue de Exemple, Paris, France"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Mot de Passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de Passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Champ Confirmation Mot de Passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmez le Mot de Passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Messages d'Erreur et de Succès */}
            {errorMessage && (
              <div className="text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="text-green-600 text-sm">
                {successMessage}
              </div>
            )}

            {githubError && (
              <div className="text-red-600 text-sm">
                {githubError}
              </div>
            )}

            {githubSuccess && (
              <div className="text-green-600 text-sm">
                {githubSuccess}
              </div>
            )}
          </div>

          {/* Bouton d'inscription */}
          <div>
            <button
              type="button"
              onClick={handleSignup}
              disabled={loadingSignup || loadingGithub || loadingAddress}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loadingSignup || loadingGithub || loadingAddress ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out`}
            >
              {loadingSignup || loadingGithub || loadingAddress ? 'Chargement...' : 'S\'inscrire'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
