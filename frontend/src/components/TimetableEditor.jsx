// frontend/src/components/TimetableEditor.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TimetableGrid from "../components/TimetableGrid";

const API_BASE_URL = "http://localhost:5000/api";

const TimetableEditor = () => {
  const navigate = useNavigate();

  const [timetableData, setTimetableData] = useState([]);
  const [timeSettings, setTimeSettings] = useState(null);
  const [resources, setResources] = useState({
    subjects: [],
    teachers: [],
    rooms: [],
    assignments: [],
  });
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSummary, setGenerationSummary] = useState(null);

  // ✅ auth axios instance (adds token header)
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
  });
  authAxios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["x-auth-token"] = token;
    return config;
  });

  // --- FETCH TIME SETTINGS ---
  const fetchTimeSettings = async () => {
    try {
      const res = await authAxios.get(`/timesettings`);
      // If none saved yet, fallback (still allow rendering)
      setTimeSettings(
        res.data || {
          startTime: "09:00",
          endTime: "15:00",
          slotDuration: 60,
          breakStart: "11:00",
          breakEnd: "11:15",
          lunchStart: "13:15",
          lunchEnd: "14:15",
          workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        }
      );
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      // graceful defaults
      setTimeSettings({
        startTime: "09:00",
        endTime: "15:00",
        slotDuration: 60,
        breakStart: "11:00",
        breakEnd: "11:15",
        lunchStart: "13:15",
        lunchEnd: "14:15",
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      });
      console.error("Error fetching time settings:", err);
    }
  };

  // --- FETCH RESOURCES ---
  const fetchResources = async () => {
    try {
      const [subjectsRes, teachersRes, roomsRes, assignmentsRes] = await Promise.all([
        authAxios.get(`/subjects`),
        authAxios.get(`/teachers`),
        authAxios.get(`/rooms`),
        authAxios.get(`/assignments`),
      ]);

      setResources({
        subjects: subjectsRes.data || [],
        teachers: teachersRes.data || [],
        rooms: roomsRes.data || [],
        assignments: assignmentsRes.data || [],
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      console.error("Error fetching resources:", err);
    }
  };

  // --- LOAD EVERYTHING ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTimeSettings(), fetchResources()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // --- GENERATE TIMETABLE ---
  const handleGenerate = async () => {
    if (!resources.assignments.length) {
      alert("Cannot generate timetable: No teacher-subject assignments exist.");
      return;
    }
    if (!timeSettings) {
      alert("Time settings are not loaded yet.");
      return;
    }

    setIsGenerating(true);
    setTimetableData([]);
    setGenerationSummary(null);

    try {
      // IMPORTANT: pass both resources AND timetableSettings
      const res = await authAxios.post(`/timetables/generate`, {
        resources,
        timetableSettings: timeSettings,
      });

      const schedule = res.data?.schedule || [];
      setTimetableData(schedule);
      setGenerationSummary(res.data?.summary || null);

      if (!schedule.length) {
        alert(
          "Generated, but schedule is empty. Check weeklyHours on subjects, assignments, or conflicts."
        );
      } else {
        alert("Timetable generated successfully!");
      }
    } catch (error) {
      console.error("Timetable generation failed:", error.response?.data || error.message);
      alert(`Timetable generation failed: ${error.response?.data?.msg || "Internal Server Error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- DRAG AND DROP HANDLER (client-only reordering) ---
  const handleDrop = (e, targetDay, targetTimeSlot) => {
    e.preventDefault();

    const droppedClassData = JSON.parse(e.dataTransfer.getData("classData"));
    const sourceDay = droppedClassData.day;
    const sourceTimeSlot = droppedClassData.timeSlot;

    if (targetTimeSlot.includes("(Break)") || targetTimeSlot.includes("(Lunch)")) {
      alert("Cannot assign a class during break/lunch time.");
      return;
    }

    setTimetableData((prev) => {
      const updated = [...prev];
      const sourceIndex = updated.findIndex(
        (item) => item.day === sourceDay && item.timeSlot === sourceTimeSlot
      );
      const targetIndex = updated.findIndex(
        (item) => item.day === targetDay && item.timeSlot === targetTimeSlot
      );
      if (sourceIndex === -1) return prev;

      const movingClass = updated[sourceIndex];
      if (targetIndex !== -1) {
        const targetClass = updated[targetIndex];
        // swap
        movingClass.day = targetDay;
        movingClass.timeSlot = targetTimeSlot;
        targetClass.day = sourceDay;
        targetClass.timeSlot = sourceTimeSlot;
        updated[sourceIndex] = targetClass;
        updated[targetIndex] = movingClass;
      } else {
        // move
        movingClass.day = targetDay;
        movingClass.timeSlot = targetTimeSlot;
      }
      return updated;
    });
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="p-8 text-center text-lg text-gray-700">
        Loading resources and settings...
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Timetable Generator</h1>

      <button
        onClick={() => navigate("/dashboard")}
        className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
      >
        ← Back to Dashboard
      </button>

      <div className="mb-4 flex gap-4">
        <button
          onClick={handleGenerate}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
          disabled={isGenerating || !resources.assignments.length}
        >
          {isGenerating ? "Generating..." : "Generate Timetable"}
        </button>
       
     
</div>
      <div className="mb-6 p-4 bg-white border rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Generation requirements</h3>
        <p className="text-sm text-gray-600">
          The generator uses your saved working days, period duration, breaks/lunch, subjects and their weekly hours, teacher-subject assignments, rooms, and lab requirements.
        </p>
        <p className="text-sm text-gray-600 mt-1">
          It prevents teacher, room, and class time clashes and keeps lab sessions consecutive.
        </p>
      </div>

      <hr className="my-6" />

      <TimetableGrid
        timetable={timetableData}
        resources={resources}
        timetableSettings={timeSettings}
        onDrop={handleDrop}
      />

      {generationSummary && timetableData.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-300 text-green-800 rounded-md">
          <b>Generated successfully:</b> {generationSummary.totalPeriods} periods for {generationSummary.subjects?.join(", ")}.
        </div>
      )}

      {timetableData.length === 0 && (
        <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
          No classes placed yet. Click <b>Auto Generate</b> to create a schedule.
        </div>
      )}
    </div>
  );
};

export default TimetableEditor;
