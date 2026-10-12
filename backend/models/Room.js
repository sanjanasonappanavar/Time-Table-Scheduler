// backend/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { // e.g., E101, Lab 1
    type: String, 
    required: true,
    unique: true 
  },
  capacity: { 
    type: Number, 
    default: 30 
  },
  type: { // e.g., 'Lecture Hall', 'Lab', 'Seminar Room'
    type: String, 
    default: 'Lecture Hall'
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
});

module.exports = mongoose.model('Room', roomSchema);