const express = require('express');
const router = express.Router();
const { getNearbyDonors, getDonorProfile, updateProfile, getDonationHistory, getMyEligibility, getAllDonors, bookSlot } = require('../controllers/donorController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/nearby', getNearbyDonors);
router.get('/all', protect, roleCheck('admin', 'hospital'), getAllDonors);
router.get('/history', protect, roleCheck('donor'), getDonationHistory);
router.get('/eligibility', protect, roleCheck('donor'), getMyEligibility);
router.put('/profile', protect, roleCheck('donor'), updateProfile);
router.get('/:id', getDonorProfile);

router.post('/book-slot', protect, roleCheck('donor'), bookSlot);

module.exports = router;
