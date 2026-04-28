const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Patient-specific routes (mainly uses requests API)
router.get('/profile', protect, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const { name, phone, bloodGroup, age, weight } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, bloodGroup, age, weight }, { new: true }).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
