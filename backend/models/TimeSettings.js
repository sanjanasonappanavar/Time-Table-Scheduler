const mongoose = require("mongoose");

const TimeSettingsSchema = new mongoose.Schema({
  startTime: { type: String, required: true, default: "09:00" },
  endTime: { type: String, required: true, default: "16:00" },
  slotDuration: { type: Number, required: true, default: 60 }, // in minutes
  breakStart: { type: String, required: true, default: "11:00" },
  breakEnd: { type: String, required: true, default: "11:15" },
  lunchStart: { type: String, required: true, default: "13:00" },
  lunchEnd: { type: String, required: true, default: "13:45" },
  workingDays: {
    type: [String],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});

module.exports = mongoose.model("TimeSettings", TimeSettingsSchema);
