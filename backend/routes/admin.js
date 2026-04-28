const express = require('express');
const router = express.Router();
const { getAnalytics, getAllHospitals, approveHospital, blockHospital, scheduleInspection, toggleBlockUser } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.use(protect, roleCheck('admin'));

router.get('/analytics', getAnalytics);
router.get('/hospitals', getAllHospitals);
router.put('/hospitals/:id/approve', approveHospital);
router.put('/hospitals/:id/block', blockHospital);
router.post('/inspections', scheduleInspection);
router.put('/users/:id/toggle-block', toggleBlockUser);

module.exports = router;
