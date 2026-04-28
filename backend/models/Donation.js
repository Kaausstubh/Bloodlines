const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bloodRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
  bloodGroup: { type: String, required: true },
  units: { type: Number, default: 1 },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'completed' },
  donorRating: { type: Number, min: 1, max: 5 },
  notes: { type: String },
  donatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
