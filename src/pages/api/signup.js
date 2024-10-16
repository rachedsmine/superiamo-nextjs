// pages/api/signup.js
import admin from '../../lib/firebaseAdmin';
import { getDistance } from 'geolib';
import { PARIS_COORDINATES } from '../../lib/constants';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { email, password, firstName, lastName, phoneNumber, address } = req.body;

  if (!email || !password || !firstName || !lastName || !phoneNumber || !address) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);
  if (!phoneNumberObj || !phoneNumberObj.isValid()) {
    return res.status(400).json({ message: 'Numéro de téléphone invalide. Utilisez le format E.164, par exemple +33612345678.' });
  }

  try {
    // Validation de l'adresse
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}`);

    if (!response.ok) {
      throw new Error('Erreur lors de la géocodification de l\'adresse');
    }

    const data = await response.json();

    if (data.features.length === 0) {
      return res.status(400).json({ message: 'Adresse non trouvée.' });
    }

    const { coordinates } = data.features[0].geometry;
    const [longitude, latitude] = coordinates;

    // Calcul de la distance
    const distance = getDistance(
      { latitude: PARIS_COORDINATES.latitude, longitude: PARIS_COORDINATES.longitude },
      { latitude, longitude }
    );

    // Conversion de la distance en kilomètres
    const distanceKm = distance / 1000;

    if (distanceKm > 50) {
      return res.status(400).json({
        message: 'L\'adresse doit être située à moins de 50 km de Paris.',
      });
    }

    // Création de l'utilisateur avec Firebase Admin
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phoneNumberObj.number, 
      disabled: false,
    });

    // Générer un lien de vérification d'email
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);

    // Sauvegarde des données supplémentaires dans Firestore
    const userRef = admin.firestore().collection('users').doc(userRecord.uid);
    await userRef.set({
      uid: userRecord.uid,
      email,
      firstName,
      lastName,
      phoneNumber: phoneNumberObj.number,
      address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
    });

    

    return res.status(201).json({
      message: 'Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.',
      verificationLink, 
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    if (error.code === 'auth/invalid-phone-number') {
      return res.status(400).json({ message: 'Numéro de téléphone invalide.' });
    }
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
