// src/pages/api/validate-address.js
import { PARIS_COORDINATES } from '../../lib/constants';
import { getDistance } from 'geolib';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { adress } = req.body;

  if (!adress) {
    return res.status(400).json({ message: 'Adresse requise' });
  }

  try {
    // Appeler l'API adresse.data.gouv.fr pour géocoder l'adresse
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adress)}`);

    if (!response.ok) {
      throw new Error('Erreur lors de la géocodification de l\'adresse');
    }

    const data = await response.json();

    if (data.features.length === 0) {
      return res.status(400).json({ message: 'Adresse non trouvée' });
    }

    // Prendre le premier résultat
    const { coordinates } = data.features[0].geometry;
    const [longitude, latitude] = coordinates;

    // Calculer la distance entre Paris et l'adresse de l'utilisateur
    const distance = getDistance(
      { latitude: PARIS_COORDINATES.latitude, longitude: PARIS_COORDINATES.longitude },
      { latitude, longitude }
    );

    // Convertir la distance en kilomètres
    const distanceKm = distance / 1000;

    // Vérifier si la distance est <= 50 km
    if (distanceKm <= 50) {
      return res.status(200).json({
        valid: true,
        distance: distanceKm,
        coordinates: { latitude, longitude },
      });
    } else {
      return res.status(400).json({
        valid: false,
        distance: distanceKm,
        message: 'L\'adresse doit être située à moins de 50 km de Paris.',
      });
    }
  } catch (error) {
    console.error('Erreur dans la validation de l\'adresse:', error);
    return res.status(500).json({ message: 'Erreur interne du serveur' });
  }
}
