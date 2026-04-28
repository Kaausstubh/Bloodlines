const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, bloodGroup, phone, age, weight, hospitalName, licenseNumber } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const userData = { name, email, password, role, phone };
    if (role === 'donor' || role === 'patient') {
      Object.assign(userData, { bloodGroup, age, weight });
    }
    if (role === 'hospital') {
      Object.assign(userData, { hospitalName, licenseNumber });
    }

    const user = await User.create(userData);
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (user.isBlocked) return res.status(403).json({ success: false, message: 'Account blocked. Contact admin.' });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update password
// @route PUT /api/auth/password
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  bloodGroup: user.bloodGroup,
  phone: user.phone,
  age: user.age,
  weight: user.weight,
  location: user.location,
  isVerified: user.isVerified,
  isActive: user.isActive,
  lastDonationDate: user.lastDonationDate,
  donationCount: user.donationCount,
  rating: user.rating,
  privacyLevel: user.privacyLevel,
  availableForDonation: user.availableForDonation,
  hospitalName: user.hospitalName,
  licenseNumber: user.licenseNumber,
  isApprovedByAdmin: user.isApprovedByAdmin,
  healthStatus: user.healthStatus,
  createdAt: user.createdAt
});

module.exports = { register, login, getMe, updatePassword };
