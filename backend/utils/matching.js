// Blood group compatibility matrix
const COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

/**
 * Get compatible donor blood groups for a patient's blood group
 */
const getCompatibleDonors = (patientBloodGroup) => {
  const compatible = [];
  for (const [donorGroup, canDonateTo] of Object.entries(COMPATIBILITY)) {
    if (canDonateTo.includes(patientBloodGroup)) {
      compatible.push(donorGroup);
    }
  }
  return compatible;
};

/**
 * Score and rank donors based on multiple factors
 */
const rankDonors = (donors, requestLocation) => {
  const now = new Date();
  const [reqLng, reqLat] = requestLocation.coordinates;

  return donors.map(donor => {
    let score = 100;
    const [donorLng, donorLat] = donor.location.coordinates;

    // Distance factor (closer = higher score)
    const distance = getDistanceKm(reqLat, reqLng, donorLat, donorLng);
    score -= distance * 10; // -10 per km

    // Recency factor (longer since last donation = more eligible)
    if (donor.lastDonationDate) {
      const daysSince = (now - donor.lastDonationDate) / (1000 * 60 * 60 * 24);
      if (daysSince > 180) score += 20; // Bonus for long-gap donors
      else if (daysSince > 90) score += 10;
    } else {
      score += 15; // Never donated before — fresh
    }

    // Rating factor
    if (donor.rating > 0) score += donor.rating * 2;

    // Donation experience
    score += Math.min(donor.donationCount * 2, 20);

    return { donor, score: Math.max(0, score), distance };
  }).sort((a, b) => b.score - a.score);
};

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => deg * (Math.PI / 180);

module.exports = { getCompatibleDonors, rankDonors, COMPATIBILITY };
