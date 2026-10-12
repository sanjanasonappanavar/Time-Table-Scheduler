// backend/models/Timetable.js
const mongoose = require('mongoose');

const ScheduleBlockSchema = new mongoose.Schema({
    day: { type: String, required: true },
    time_slot: { type: String, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
});

const timetableSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    schedule: [ScheduleBlockSchema],
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', timetableSchema);