const express = require('express');
const router = express.Router();
const { getDashboard, verifyDonor, getHospitals, updateHealthRecord } = require('../controllers/hospitalController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', getHospitals);
router.get('/dashboard', protect, roleCheck('hospital'), getDashboard);
router.put('/verify/:donorId', protect, roleCheck('hospital'), verifyDonor);
router.put('/health-record/:donorId', protect, roleCheck('hospital'), updateHealthRecord);

module.exports = router;
