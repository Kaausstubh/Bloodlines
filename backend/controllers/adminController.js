const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

// @desc  Get admin dashboard analytics
// @route GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [totalDonors, verifiedDonors, totalPatients, totalHospitals, approvedHospitals,
      totalRequests, fulfilledRequests, emergencyRequests, totalDonations] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'donor', isVerified: true }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'hospital' }),
      User.countDocuments({ role: 'hospital', isApprovedByAdmin: true }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      BloodRequest.countDocuments({ urgency: 'emergency' }),
      Donation.countDocuments()
    ]);

    // Monthly donation trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyDonations = await Donation.aggregate([
      { $match: { donatedAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { month: { $month: '$donatedAt' }, year: { $year: '$donatedAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalDonors, verifiedDonors, totalPatients, totalHospitals, approvedHospitals,
        totalRequests, fulfilledRequests, emergencyRequests, totalDonations,
        fulfillmentRate: totalRequests ? Math.round((fulfilledRequests / totalRequests) * 100) : 0
      },
      monthlyDonations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all hospitals (pending + approved)
// @route GET /api/admin/hospitals
const getAllHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: hospitals.length, hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve a hospital
// @route PUT /api/admin/hospitals/:id/approve
const approveHospital = async (req, res) => {
  try {
    const hospital = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'hospital' },
      { isApprovedByAdmin: true },
      { new: true }
    ).select('-password');

    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: hospital._id,
      type: 'hospital_approved',
      title: '🏥 Hospital Approved!',
      message: 'Your hospital has been approved by the government admin. You can now verify donors.',
    });
    io.to(hospital._id.toString()).emit('notification', notif);

    res.json({ success: true, message: 'Hospital approved', hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Block a hospital
// @route PUT /api/admin/hospitals/:id/block
const blockHospital = async (req, res) => {
  try {
    const { reason } = req.body;
    const hospital = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'hospital' },
      { isBlocked: true, isApprovedByAdmin: false },
      { new: true }
    ).select('-password');

    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const io = req.app.get('io');
    await Notification.create({
      recipient: hospital._id,
      type: 'hospital_blocked',
      title: '⛔ Hospital Blocked',
      message: `Your hospital has been blocked by the admin. Reason: ${reason || 'Policy violation'}`,
      urgent: true
    });

    res.json({ success: true, message: 'Hospital blocked', hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Schedule inspection reminder
// @route POST /api/admin/inspections
const scheduleInspection = async (req, res) => {
  try {
    const { hospitalId, scheduledDate, message } = req.body;
    const hospital = await User.findById(hospitalId);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    await User.findByIdAndUpdate(hospitalId, { lastInspection: scheduledDate });

    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: hospitalId,
      type: 'inspection_reminder',
      title: '📋 Inspection Scheduled',
      message: message || `Your hospital inspection is scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
    });
    io.to(hospitalId.toString()).emit('notification', notif);

    res.json({ success: true, message: 'Inspection reminder sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Block/unblock a user
// @route PUT /api/admin/users/:id/toggle-block
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAnalytics, getAllHospitals, approveHospital, blockHospital, scheduleInspection, toggleBlockUser };
