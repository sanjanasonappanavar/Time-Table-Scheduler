// backend/models/Subject.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  weeklyHours: { 
    type: Number,
    required: true,
    min: 1
  },
  isLab: { 
    type: Boolean,
    default: false 
  },
  sessionDuration: { 
    type: Number,
    min: 1
  },
  labLocation: { 
    type: String,
    trim: true,
  },
  requiresBatching: { 
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

subjectSchema.index({ code: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);