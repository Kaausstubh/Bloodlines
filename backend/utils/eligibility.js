const MIN_DONATION_GAP_DAYS = 56; // 8 weeks standard
const MIN_AGE = 18;
const MAX_AGE = 65;
const MIN_WEIGHT_KG = 50;

/**
 * Check full eligibility of a donor
 * Returns { eligible: Boolean, reason: String }
 */
const checkEligibility = (donor) => {
  if (donor.isBlocked) return { eligible: false, reason: 'Account is blocked by admin.' };
  if (!donor.isVerified) return { eligible: false, reason: 'Not yet verified by a hospital.' };
  if (donor.healthStatus === 'ineligible') return { eligible: false, reason: 'Marked ineligible by hospital.' };
  if (donor.healthStatus === 'under-medication') return { eligible: false, reason: 'Currently under medication.' };

  if (donor.age && (donor.age < MIN_AGE || donor.age > MAX_AGE)) {
    return { eligible: false, reason: `Age must be between ${MIN_AGE} and ${MAX_AGE}.` };
  }

  if (donor.weight && donor.weight < MIN_WEIGHT_KG) {
    return { eligible: false, reason: `Weight must be at least ${MIN_WEIGHT_KG}kg.` };
  }

  if (donor.lastDonationDate) {
    const daysSince = (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24);
    if (daysSince < MIN_DONATION_GAP_DAYS) {
      const daysLeft = Math.ceil(MIN_DONATION_GAP_DAYS - daysSince);
      return { eligible: false, reason: `Must wait ${daysLeft} more day(s) since last donation.` };
    }
  }

  return { eligible: true, reason: 'Eligible to donate.' };
};

/**
 * Get days until eligible again
 */
const daysUntilEligible = (lastDonationDate) => {
  if (!lastDonationDate) return 0;
  const daysSince = (Date.now() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(MIN_DONATION_GAP_DAYS - daysSince));
};

module.exports = { checkEligibility, daysUntilEligible, MIN_DONATION_GAP_DAYS };
