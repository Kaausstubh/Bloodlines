const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  unitsNeeded: { type: Number, default: 1 },
  urgency: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    address: { type: String }
  },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'matched', 'fulfilled', 'cancelled'], default: 'open' },
  matchedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  respondedDonors: [{
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['accepted', 'declined', 'pending'], default: 'pending' }
  }],
  notes: { type: String },
  contactPhone: { type: String },
  expiresAt: { type: Date },
  fulfilledAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
