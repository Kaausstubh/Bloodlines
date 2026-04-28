const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getMatchedDonors, respondToRequest, fulfillRequest, getMyRequests } = require('../controllers/requestController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

router.get('/', getRequests);
router.post('/', protect, roleCheck('patient', 'admin'), createRequest);
router.get('/my', protect, roleCheck('patient'), getMyRequests);
router.get('/:id/matches', protect, getMatchedDonors);
router.put('/:id/respond', protect, roleCheck('donor'), respondToRequest);
router.put('/:id/fulfill', protect, roleCheck('hospital', 'admin'), fulfillRequest);

module.exports = router;
