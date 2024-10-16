// pages/index.js

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import localFont from "next/font/local";
import { motion } from 'framer-motion';
import { FaGithub, FaTwitter, FaFacebook, FaLinkedin } from 'react-icons/fa';


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Chargement...</div>
      </div>
    );
  }

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
    >
      {/* Header */}
      <header className="w-full py-6 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            {/* Logo texte ou SVG peut être ajouté ici si nécessaire */}
            <span className="text-2xl font-bold">SuperiamoApp</span>
          </Link>
          <nav className="space-x-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Profil
                </Link>
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
                >
                  Tableau de Bord
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Se Connecter
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Bienvenue sur Speriamo
          </h1>
          <p className="text-lg sm:text-xl mb-8 text-gray-600 dark:text-gray-300">
            Connectez-vous ou inscrivez-vous pour accéder à votre profil et gérer vos informations en toute simplicité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                href="/profile"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-center"
              >
                Voir votre Profil
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-center"
                >
                  Se Connecter
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-center"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
