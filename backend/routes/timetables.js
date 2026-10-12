const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const TimeSettings = require("../models/TimeSettings");

const toMinutes = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  return h * 60 + m;
};

const toTime = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${m.toString().padStart(2, "0")}${ampm}`;
};

const buildTimeSlots = (settings) => {
  const start = toMinutes(settings.startTime || "09:00");
  const end = toMinutes(settings.endTime || "17:00");
  const duration = Number(settings.slotDuration || 60);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Period duration must be greater than 0 minutes.");
  }
  if (start >= end) throw new Error("Start time must be before end time.");

  const breaks = [];
  if (settings.breakStart && settings.breakEnd) {
    const s = toMinutes(settings.breakStart);
    const e = toMinutes(settings.breakEnd);
    if (s < e) breaks.push({ start: s, end: e, type: "break" });
  }
  if (settings.lunchStart && settings.lunchEnd) {
    const s = toMinutes(settings.lunchStart);
    const e = toMinutes(settings.lunchEnd);
    if (s < e) breaks.push({ start: s, end: e, type: "lunch" });
  }

  const slots = [];
  let current = start;
  while (current < end) {
    const activeBreak = breaks.find((b) => current >= b.start && current < b.end);
    if (activeBreak) {
      current = activeBreak.end;
      continue;
    }

    const nextBreak = breaks
      .filter((b) => b.start > current)
      .sort((a, b) => a.start - b.start)[0];
    const next = Math.min(current + duration, end, nextBreak ? nextBreak.start : end);

    // Do not create a partial period just before a break.
    if (next > current) {
      slots.push({
        key: `${toTime(current)}-${toTime(next)}`,
        start: current,
        end: next,
      });
      current = next;
    } else {
      current += duration;
    }
  }

  return { slots, breaks };
};

const getId = (value) => String(value?._id || value || "");

const generateSchedule = (resources, settings) => {
  const { assignments = [], subjects = [], teachers = [], rooms = [] } = resources || {};
  const workingDays = settings.workingDays || [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];

  if (!workingDays.length) throw new Error("Select at least one working day.");
  if (!assignments.length) throw new Error("No teacher-subject assignments found.");
  if (!subjects.length) throw new Error("No subjects found.");
  if (!teachers.length) throw new Error("No teachers found.");
  if (!rooms.length) throw new Error("No rooms found. Add at least one room.");

  const { slots } = buildTimeSlots(settings);
  if (!slots.length) throw new Error("No usable periods exist with the current time settings.");

  const subjectMap = new Map(subjects.map((s) => [getId(s), s]));
  const teacherMap = new Map(teachers.map((t) => [getId(t), t]));
  const roomMap = new Map(rooms.map((r) => [getId(r), r]));

  // One timetable represents one class/section. Therefore one class cannot have
  // two subjects at the same day/time.
  const classBusy = new Set();
  const teacherBusy = new Set();
  const roomBusy = new Set();
  const subjectDayCount = new Map();
  const schedule = [];

  const roomIsLab = (room) => /lab/i.test(room.name || "");
  const availableRooms = (isLab, preferredLocation) => {
    let candidates = rooms;
    if (isLab) {
      const labs = rooms.filter(roomIsLab);
      if (labs.length) candidates = labs;
    } else {
      const normal = rooms.filter((r) => !roomIsLab(r));
      if (normal.length) candidates = normal;
    }

    if (preferredLocation) {
      const exact = candidates.filter(
        (r) => String(r.name).toLowerCase() === String(preferredLocation).toLowerCase()
      );
      if (exact.length) candidates = exact;
    }
    return candidates;
  };

  const canPlace = (day, slot, teacher, room) => {
    const classKey = `${day}|${slot.key}`;
    const teacherKey = `${getId(teacher)}|${classKey}`;
    const roomKey = `${getId(room)}|${classKey}`;
    return !classBusy.has(classKey) && !teacherBusy.has(teacherKey) && !roomBusy.has(roomKey);
  };

  const place = (assignment, subject, teacher, room, day, slot, isLab, batch) => {
    const classKey = `${day}|${slot.key}`;
    classBusy.add(classKey);
    teacherBusy.add(`${getId(teacher)}|${classKey}`);
    roomBusy.add(`${getId(room)}|${classKey}`);
    const countKey = getId(subject);
    subjectDayCount.set(`${countKey}|${day}`, (subjectDayCount.get(`${countKey}|${day}`) || 0) + 1);

    schedule.push({
      day,
      timeSlot: slot.key,
      subject,
      teacher,
      room,
      batch: batch || "Main Batch",
      isLab,
      assignmentId: assignment._id,
    });
  };

  const jobs = assignments
    .map((assignment) => {
      const subject = subjectMap.get(getId(assignment.subject));
      const teacher = teacherMap.get(getId(assignment.teacher));
      if (!subject || !teacher) return null;
      const isLab = Boolean(subject.isLab) || /lab/i.test(subject.code || "") || /lab/i.test(subject.name || "");
      const weeklyHours = Number(subject.weeklyHours || 0);
      const sessionDuration = Math.max(1, Number(subject.sessionDuration || (isLab ? 2 : 1)));
      return {
        assignment,
        subject,
        teacher,
        isLab,
        weeklyHours,
        sessionDuration,
        batch: assignment.batchName || "Main Batch",
      };
    })
    .filter(Boolean);

  const invalid = jobs.filter((job) => !job.weeklyHours || job.weeklyHours < 1);
  if (invalid.length) {
    throw new Error(`Set Weekly Hours for: ${invalid.map((j) => j.subject.code).join(", ")}`);
  }

  // Labs are placed first because they need consecutive periods and preferably lab rooms.
  // Higher-hour subjects are also placed first so the most constrained requirements get slots.
  jobs.sort((a, b) => {
    if (a.isLab !== b.isLab) return a.isLab ? -1 : 1;
    return b.sessionDuration - a.sessionDuration || b.weeklyHours - a.weeklyHours;
  });

  const unscheduled = [];

  for (const job of jobs) {
    let remaining = job.weeklyHours;
    const sessionLength = job.isLab ? Math.max(2, job.sessionDuration) : 1;

    while (remaining > 0) {
      let placed = false;

      // Spread sessions across days instead of putting all weekly hours on one day.
      const dayOrder = workingDays
        .map((day, index) => ({
          day,
          index,
          count: subjectDayCount.get(`${getId(job.subject)}|${day}`) || 0,
        }))
        .sort((a, b) => a.count - b.count || a.index - b.index);

      for (const { day } of dayOrder) {
        if (job.isLab && (remaining < sessionLength)) continue;

        for (let i = 0; i <= slots.length - sessionLength; i++) {
          const candidateSlots = slots.slice(i, i + sessionLength);
          if (candidateSlots.length !== sessionLength) continue;

          // Labs must occupy consecutive periods on the same day.
          if (job.isLab) {
            const contiguous = candidateSlots.every((s, idx) =>
              idx === 0 || s.start === candidateSlots[idx - 1].end
            );
            if (!contiguous) continue;
          }

          const roomsForJob = availableRooms(job.isLab, job.subject.labLocation);

          // Use ONE room for the complete session. For labs this matters because
          // a two-period lab must stay in the same room.
          const room = roomsForJob.find((candidateRoom) =>
            candidateSlots.every((slot) => canPlace(day, slot, job.teacher, candidateRoom))
          );
          if (!room) continue;

          // If a specific lab location was requested, never silently move it elsewhere.
          if (job.isLab && job.subject.labLocation) {
            const exact = roomsForJob.find(
              (r) => String(r.name).toLowerCase() === String(job.subject.labLocation).toLowerCase()
            );
            if (!exact) {
              throw new Error(`Lab room "${job.subject.labLocation}" for ${job.subject.code} was not found.`);
            }
            if (!candidateSlots.every((slot) => canPlace(day, slot, job.teacher, exact))) continue;
          }

          for (const slot of candidateSlots) place(job.assignment, job.subject, job.teacher, room, day, slot, job.isLab, job.batch);
          remaining -= sessionLength;
          placed = true;
          break;
        }
        if (placed) break;
      }

      if (!placed) {
        unscheduled.push({ code: job.subject.code, remaining, teacher: job.teacher.name });
        break;
      }
    }
  }

  if (unscheduled.length) {
    const details = unscheduled.map((u) => `${u.code}: ${u.remaining} period(s)`).join(", ");
    throw new Error(`Could not place all required periods. Unscheduled: ${details}. Add more periods/rooms, reduce weekly hours, or adjust constraints.`);
  }

  // Stable Monday-to-Saturday / time order for the frontend.
  const dayIndex = new Map(workingDays.map((d, i) => [d, i]));
  const slotIndex = new Map(slots.map((s, i) => [s.key, i]));
  schedule.sort((a, b) =>
    (dayIndex.get(a.day) ?? 999) - (dayIndex.get(b.day) ?? 999) ||
    (slotIndex.get(a.timeSlot) ?? 999) - (slotIndex.get(b.timeSlot) ?? 999)
  );

  return schedule;
};

router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const { resources, timetableSettings } = req.body;
    const settings = timetableSettings || (await TimeSettings.findOne({ user: req.user.id }));

    if (!settings) {
      return res.status(400).json({ msg: "Please configure time settings first." });
    }

    const schedule = generateSchedule(resources, settings);
    res.json({
      msg: "Timetable generated successfully",
      schedule,
      summary: {
        totalPeriods: schedule.length,
        subjects: [...new Set(schedule.map((item) => item.subject.code))],
      },
    });
  } catch (err) {
    console.error("Timetable generation failed:", err);
    res.status(400).json({ msg: err.message || "Timetable generation failed." });
  }
});

module.exports = router;
