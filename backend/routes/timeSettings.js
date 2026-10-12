const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const TimeSettings = require("../models/TimeSettings");

// ✅ Fetch existing time settings
router.get("/", authMiddleware, async (req, res) => {
  try {
    const settings = await TimeSettings.findOne();
    if (!settings) {
      return res.status(404).json({ msg: "No time settings found" });
    }
    res.json(settings);
  } catch (err) {
    console.error("❌ Error fetching time settings:", err);
    res.status(500).json({ msg: "Server error fetching settings" });
  }
});

// ✅ Create or update time settings
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      startTime,
      endTime,
      slotDuration,
      breakStart,
      breakEnd,
      lunchStart,
      lunchEnd,
      workingDays,
    } = req.body;

    let settings = await TimeSettings.findOne();
    if (settings) {
      // Update existing settings
      settings.startTime = startTime;
      settings.endTime = endTime;
      settings.slotDuration = slotDuration;
      settings.breakStart = breakStart;
      settings.breakEnd = breakEnd;
      settings.lunchStart = lunchStart;
      settings.lunchEnd = lunchEnd;
      settings.workingDays = workingDays;
      await settings.save();
    } else {
      // Create new settings
      settings = new TimeSettings({
        startTime,
        endTime,
        slotDuration,
        breakStart,
        breakEnd,
        lunchStart,
        lunchEnd,
        workingDays,
      });
      await settings.save();
    }

    res.json({ msg: "Time settings saved successfully", settings });
  } catch (err) {
    console.error("❌ Error saving time settings:", err);
    res.status(500).json({ msg: "Error saving time settings" });
  }
});

module.exports = router;
