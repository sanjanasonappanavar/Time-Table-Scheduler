// backend/models/Teacher.js
const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  initials: {
    type: String,
    required: true,
    unique: true // Ensure initials are unique for easy identification
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

// Add index for user context
teacherSchema.index({ initials: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', teacherSchema);