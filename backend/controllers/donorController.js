const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { checkEligibility, daysUntilEligible } = require('../utils/eligibility');
const { getCompatibleDonors, rankDonors } = require('../utils/matching');

// @desc  Get nearby donors
// @route GET /api/donors/nearby?lat=&lng=&radius=&bloodGroup=
const getNearbyDonors = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, bloodGroup } = req.query;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'Location required' });

    const query = {
      role: 'donor',
      isVerified: true,
      isBlocked: false,
      availableForDonation: true,
      privacyLevel: { $in: ['public', 'semi-private'] },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      }
    };

    if (bloodGroup) {
      const compatibleGroups = getCompatibleDonors(bloodGroup);
      query.bloodGroup = { $in: compatibleGroups };
    }

    const donors = await User.find(query).select('-password -notifications').limit(50);
    res.json({ success: true, count: donors.length, donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get donor profile
// @route GET /api/donors/:id
const getDonorProfile = async (req, res) => {
  try {
    const donor = await User.findOne({ _id: req.params.id, role: 'donor' }).select('-password');
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    const eligibility = checkEligibility(donor);
    const daysLeft = daysUntilEligible(donor.lastDonationDate);

    res.json({ success: true, donor, eligibility, daysLeft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update donor profile
// @route PUT /api/donors/profile
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'age', 'weight', 'bloodGroup', 'privacyLevel', 'availableForDonation', 'location', 'healthStatus'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get donor donation history
// @route GET /api/donors/history
const getDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('patient', 'name bloodGroup')
      .populate('hospital', 'name hospitalName')
      .sort({ donatedAt: -1 });
    res.json({ success: true, donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my eligibility status
// @route GET /api/donors/eligibility
const getMyEligibility = async (req, res) => {
  try {
    const donor = await User.findById(req.user._id);
    const eligibility = checkEligibility(donor);
    const daysLeft = daysUntilEligible(donor.lastDonationDate);
    res.json({ success: true, eligibility, daysLeft });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all donors (admin only)
// @route GET /api/donors
const getAllDonors = async (req, res) => {
  try {
    const donors = await User.find({ role: 'donor' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: donors.length, donors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Book a slot at a hospital
// @route POST /api/donors/book-slot
const bookSlot = async (req, res) => {
  try {
    const { hospitalId, bloodGroup, units = 1 } = req.body;
    if (!hospitalId || !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Hospital and Blood Group are required' });
    }

    const donation = await Donation.create({
      donor: req.user._id,
      hospital: hospitalId,
      bloodGroup,
      units,
      status: 'scheduled'
    });

    res.status(201).json({ success: true, message: 'Slot booked successfully', donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getNearbyDonors, getDonorProfile, updateProfile, getDonationHistory, getMyEligibility, getAllDonors, bookSlot };
