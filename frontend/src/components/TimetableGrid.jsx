import React from "react";

// --- Helper time conversion utilities ---
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTimeString = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${m.toString().padStart(2, "0")}${ampm}`;
};

// --- MAIN COMPONENT ---
const TimetableGrid = ({ timetable = [], timetableSettings = {}, onDrop }) => {
  // 🗓️ Days of the week (dynamic support)
  const days =
    timetableSettings?.workingDays?.length > 0
      ? timetableSettings.workingDays
      : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // 🕒 Generate time slots dynamically from settings
  const generateTimeSlots = () => {
    if (!timetableSettings?.startTime || !timetableSettings?.endTime) return [];

    const slots = [];
    const start = toMinutes(timetableSettings.startTime);
    const end = toMinutes(timetableSettings.endTime);
    const breakStart = toMinutes(timetableSettings.breakStart || "00:00");
    const breakEnd = toMinutes(timetableSettings.breakEnd || "00:00");
    const lunchStart = toMinutes(timetableSettings.lunchStart || "00:00");
    const lunchEnd = toMinutes(timetableSettings.lunchEnd || "00:00");
    const slotDuration =
      Number(timetableSettings.slotDuration) ||
      Number(timetableSettings.periodDuration) ||
      60;

    let current = start;

    while (current < end) {
      // Break
      if (current >= breakStart && current < breakEnd) {
        slots.push({
          type: "break",
          start: breakStart,
          end: breakEnd,
          label: "Break",
        });
        current = breakEnd;
        continue;
      }

      // Lunch
      if (current >= lunchStart && current < lunchEnd) {
        slots.push({
          type: "lunch",
          start: lunchStart,
          end: lunchEnd,
          label: "Lunch",
        });
        current = lunchEnd;
        continue;
      }

      // Regular slot
      const next = Math.min(current + slotDuration, end);
      slots.push({
        type: "slot",
        start: current,
        end: next,
        label: `${toTimeString(current)}-${toTimeString(next)}`,
      });
      current = next;
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // --- Find session by day/slot ---
  const findSlot = (day, timeSlot) => {
    return (
      timetable.find((item) => item.day === day && item.timeSlot === timeSlot) ||
      null
    );
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e, slotData) => {
    if (slotData.isBreak || slotData.isHiddenDuplicate) return;
    e.dataTransfer.setData("classData", JSON.stringify(slotData));
    e.currentTarget.classList.add(
      "opacity-50",
      "border-dashed",
      "border-4",
      "border-red-500"
    );
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove(
      "opacity-50",
      "border-dashed",
      "border-4",
      "border-red-500"
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("bg-blue-200");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("bg-blue-200");
  };

  const handleLocalDrop = (e, day, timeSlot) => {
    e.currentTarget.classList.remove("bg-blue-200");
    if (timeSlot.includes("Break") || timeSlot.includes("Lunch")) {
      alert("Cannot assign a class during a reserved break/lunch time.");
      return;
    }
    if (onDrop) onDrop(e, day, timeSlot);
  };

  // --- Render ---
  return (
    <div className="mt-8 overflow-x-auto">
      <h3 className="text-2xl font-semibold mb-4">Generated Schedule</h3>

      {timetable.length === 0 && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md mb-4">
          <p>No schedule yet. Click 'Auto Generate' to create one.</p>
        </div>
      )}

      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">Time</th>
            {days.map((day) => (
              <th
                key={day}
                className="py-2 px-4 border-b border-l text-gray-700 font-semibold text-center"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {timeSlots.map((slot, i) => {
            const label =
              slot.type === "break" || slot.type === "lunch"
                ? `${toTimeString(slot.start)}-${toTimeString(slot.end)} (${slot.label})`
                : `${toTimeString(slot.start)}-${toTimeString(slot.end)}`;

            const rowColor =
              slot.type === "break"
                ? "bg-red-50"
                : slot.type === "lunch"
                ? "bg-yellow-50"
                : "bg-white";

            return (
              <tr key={i} className="hover:bg-gray-50">
                <td
                  className={`py-2 px-4 border-b font-medium text-gray-800 ${rowColor}`}
                >
                  {label}
                </td>

                {days.map((day) => {
                  const timeSlotKey = `${toTimeString(slot.start)}-${toTimeString(
                    slot.end
                  )}`;
                  const slotData = findSlot(day, timeSlotKey);

                  if (slot.type !== "slot") {
                    return (
                      <td
                        key={`${day}-${i}`}
                        className={`py-1 px-1 border-b border-l text-sm text-center font-bold text-red-700 ${rowColor}`}
                      >
                        {slot.label.toUpperCase()}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${day}-${i}`}
                      className="py-1 px-1 border-b border-l text-sm align-top transition-all duration-150 h-20"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleLocalDrop(e, day, timeSlotKey)}
                    >
                      {slotData ? (
                        <div
                          className={`p-1 rounded shadow-md h-full flex flex-col justify-center cursor-grab transition-colors duration-150 ${
                            slotData.isLab
                              ? "bg-green-100 border-green-300 hover:bg-green-200"
                              : "bg-blue-100 border-blue-300 hover:bg-blue-200"
                          }`}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, slotData)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="font-bold text-center leading-tight">
                            {slotData.subject?.code}
                            {/* ✅ Show batch name only for labs */}
                            {slotData.isLab && slotData.batch
                              ? ` (${slotData.batch})`
                              : ""}
                          </div>
                          <div className="text-gray-700 text-xs mt-0.5 text-center">
                            {slotData.teacher?.initials} /{" "}
                            <span className="font-semibold">
                              {slotData.room?.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs italic text-center pt-2">
                          Drop here
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid;
