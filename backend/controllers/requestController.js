const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { getCompatibleDonors, rankDonors } = require('../utils/matching');
const { checkEligibility } = require('../utils/eligibility');

// @desc  Create blood request
// @route POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { patientName, bloodGroup, unitsNeeded, urgency, address, lat, lng, contactPhone, notes, hospital } = req.body;
    const request = await BloodRequest.create({
      requestedBy: req.user._id,
      patientName,
      bloodGroup,
      unitsNeeded,
      urgency: urgency || 'normal',
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)], address },
      contactPhone,
      notes,
      hospital,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Find & notify nearby compatible donors
    const compatibleGroups = getCompatibleDonors(bloodGroup);
    const nearbyDonors = await User.find({
      role: 'donor', isVerified: true, isBlocked: false,
      bloodGroup: { $in: compatibleGroups },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 5000
        }
      }
    }).limit(20);

    const io = req.app.get('io');

    for (const donor of nearbyDonors) {
      const notif = await Notification.create({
        recipient: donor._id,
        type: urgency === 'emergency' ? 'emergency_request' : 'blood_request',
        title: urgency === 'emergency' ? '🚨 Emergency Blood Request!' : '🩸 Blood Request Nearby',
        message: `${bloodGroup} blood needed near ${address || 'your location'}`,
        data: { requestId: request._id },
        urgent: urgency === 'emergency'
      });
      io.to(donor._id.toString()).emit('notification', notif);
    }

    // If emergency — also broadcast to all connected clients in area
    if (urgency === 'emergency') {
      io.emit('emergency', { request, nearbyCount: nearbyDonors.length });
    }

    res.status(201).json({ success: true, request, notifiedDonors: nearbyDonors.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all blood requests
// @route GET /api/requests
const getRequests = async (req, res) => {
  try {
    const { status, urgency, bloodGroup } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(filter)
      .populate('requestedBy', 'name phone email')
      .populate('hospital', 'name hospitalName')
      .sort({ urgency: -1, createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get smart-matched donors for a request
// @route GET /api/requests/:id/matches
const getMatchedDonors = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const compatibleGroups = getCompatibleDonors(request.bloodGroup);
    const donors = await User.find({
      role: 'donor', isVerified: true, isBlocked: false,
      bloodGroup: { $in: compatibleGroups },
      location: {
        $near: {
          $geometry: request.location,
          $maxDistance: 10000
        }
      }
    }).limit(30);

    const eligibleDonors = donors.filter(d => checkEligibility(d).eligible);
    const ranked = rankDonors(eligibleDonors, request.location);

    res.json({ success: true, matches: ranked.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Donor responds to a request
// @route PUT /api/requests/:id/respond
const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const existing = request.respondedDonors.find(r => r.donor.toString() === req.user._id.toString());
    if (existing) {
      existing.status = status;
    } else {
      request.respondedDonors.push({ donor: req.user._id, status });
    }

    if (status === 'accepted' && request.status === 'open') {
      request.status = 'matched';
      if (!request.matchedDonors.includes(req.user._id)) {
        request.matchedDonors.push(req.user._id);
      }
    }
    await request.save();

    // Notify patient
    const io = req.app.get('io');
    const notif = await Notification.create({
      recipient: request.requestedBy,
      type: 'donor_responded',
      title: status === 'accepted' ? '✅ Donor Accepted!' : 'Donor Declined',
      message: `A donor has ${status} your blood request.`,
      data: { requestId: request._id, donorId: req.user._id }
    });
    io.to(request.requestedBy.toString()).emit('notification', notif);

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark request as fulfilled and create donation record
// @route PUT /api/requests/:id/fulfill
const fulfillRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    await request.save();

    // Update donor's last donation date
    const donorId = req.body.donorId || (request.matchedDonors[0]);
    if (donorId) {
      await User.findByIdAndUpdate(donorId, {
        lastDonationDate: new Date(),
        $inc: { donationCount: 1 }
      });
      await Donation.create({
        donor: donorId,
        patient: request.requestedBy,
        bloodRequest: request._id,
        bloodGroup: request.bloodGroup,
        units: request.unitsNeeded
      });
    }

    res.json({ success: true, message: 'Request fulfilled', request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get my requests (patient)
// @route GET /api/requests/my
const getMyRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requestedBy: req.user._id })
      .populate('matchedDonors', 'name bloodGroup phone rating')
      .sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRequest, getRequests, getMatchedDonors, respondToRequest, fulfillRequest, getMyRequests };
