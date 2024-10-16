import { useState } from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa'; 
import { motion } from 'framer-motion';
import { useRouter } from 'next/router'; 
import { auth } from '../lib/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import useGithubAuth from '../hooks/useGithubAuth'; 

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const router = useRouter();

  const { handleSocialLogin, loading: loadingGithub, errorMessage: githubError, successMessage: githubSuccess } = useGithubAuth();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async () => {
    const { email, password } = formData;

    setLoadingLogin(true);
    setErrorMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/profile'); 
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setErrorMessage(error.message);
    }

    setLoadingLogin(false);
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
            Connectez-vous à votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              créez un nouveau compte
            </Link>
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          {/* Bouton de connexion GitHub */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleSocialLogin('github')} // Correction ici
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loadingGithub || loadingLogin}
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

          {/* Formulaire de connexion */}
          <div className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="••••••••"
                  value={formData.password}
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

          {/* Bouton de connexion */}
          <div>
            <button
              type="button"
              onClick={handleLogin}
              disabled={loadingLogin || loadingGithub}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loadingLogin || loadingGithub ? 'bg-green-300' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out`}
            >
              {loadingLogin || loadingGithub ? 'Chargement...' : 'Se Connecter'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
