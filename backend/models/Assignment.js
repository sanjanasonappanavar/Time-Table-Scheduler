// backend/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { timestamps: true });

// CRITICAL: This index prevents duplicate assignments.
assignmentSchema.index({ teacher: 1, subject: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);