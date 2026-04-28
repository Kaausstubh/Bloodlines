const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc  Get hospital dashboard stats
// @route GET /api/hospitals/dashboard
const getDashboard = async (req, res) => {
  try {
    const pendingDonors = await User.find({ role: 'donor', isVerified: false, isBlocked: false }).select('-password');
    const verifiedDonors = await User.find({ role: 'donor', isVerified: true, verifiedBy: req.user._id }).select('-password');
    const recentDonations = await Donation.find({ hospital: req.user._id })
      .populate('donor', 'name bloodGroup').sort({ donatedAt: -1 }).limit(10);

    res.json({
      success: true,
      stats: {
        pendingVerifications: pendingDonors.length,
        verifiedByMe: verifiedDonors.length,
        recentDonations: recentDonations.length
      },
      pendingDonors,
      verifiedDonors,
      recentDonations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Verify a donor
// @route PUT /api/hospitals/verify/:donorId
const verifyDonor = async (req, res) => {
  try {
    if (!req.user.isApprovedByAdmin) {
      return res.status(403).json({ success: false, message: 'Hospital not approved by admin yet.' });
    }

    const { action, healthStatus, notes } = req.body; // action: 'approve' | 'reject'
    const donor = await User.findOne({ _id: req.params.donorId, role: 'donor' });
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    if (action === 'approve') {
      donor.isVerified = true;
      donor.verifiedBy = req.user._id;
      donor.verifiedAt = new Date();
      donor.healthStatus = healthStatus || 'healthy';
    } else {
      donor.isVerified = false;
      donor.healthStatus = 'ineligible';
    }
    await donor.save();

    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: donor._id,
      type: action === 'approve' ? 'verification_approved' : 'verification_rejected',
      title: action === 'approve' ? '✅ Verification Approved!' : '❌ Verification Rejected',
      message: action === 'approve'
        ? `You have been verified by ${req.user.hospitalName}. You can now donate blood!`
        : `Your verification was rejected by ${req.user.hospitalName}. ${notes || ''}`,
      data: { hospitalId: req.user._id }
    });
    io.to(donor._id.toString()).emit('notification', notif);

    res.json({ success: true, message: `Donor ${action}d successfully`, donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get list of all approved hospitals
// @route GET /api/hospitals
const getHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital', isApprovedByAdmin: true, isBlocked: false })
      .select('name hospitalName location licenseNumber lastInspection createdAt');
    res.json({ success: true, count: hospitals.length, hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update donor health record
// @route PUT /api/hospitals/health-record/:donorId
const updateHealthRecord = async (req, res) => {
  try {
    const { healthStatus, medicalReportUrl } = req.body;
    const donor = await User.findByIdAndUpdate(
      req.params.donorId,
      { healthStatus, medicalReportUrl },
      { new: true }
    ).select('-password');
    res.json({ success: true, donor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboard, verifyDonor, getHospitals, updateHealthRecord };
