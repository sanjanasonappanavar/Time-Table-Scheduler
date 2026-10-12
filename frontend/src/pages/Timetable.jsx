// frontend/src/pages/Timetable.jsx (Updated & Final)
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import TimetableGrid from "../components/TimetableGrid";

const API_BASE_URL = "http://localhost:5000/api";

const Timetable = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resources, setResources] = useState({
    subjects: [],
    teachers: [],
    rooms: [],
    assignments: [],
  });
  const [timetableData, setTimetableData] = useState([]);
  const [timeSettings, setTimeSettings] = useState(null); // ✅ new
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: { "x-auth-token": localStorage.getItem("token") },
  });

  // --- FETCH TIME SETTINGS ---
  const fetchTimeSettings = useCallback(async () => {
    try {
      const res = await authAxios.get("/timesettings");
      if (res.data) {
        setTimeSettings(res.data);
      } else {
        alert("No time settings found. Please configure your time settings first.");
        navigate("/timesettings");
      }
    } catch (err) {
      console.error("Error fetching time settings:", err);
      alert("Failed to load time settings. Please check your connection or reconfigure.");
    }
  }, [authAxios, navigate]);

  // --- FETCH RESOURCES ---
  const fetchResourcesForGeneration = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, roomsRes, assignmentsRes] = await Promise.all([
        authAxios.get("/subjects"),
        authAxios.get("/teachers"),
        authAxios.get("/rooms"),
        authAxios.get("/assignments"),
      ]);

      setResources({
        subjects: subjectsRes.data,
        teachers: teachersRes.data,
        rooms: roomsRes.data,
        assignments: assignmentsRes.data,
      });
    } catch (err) {
      console.error("Error fetching resources:", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      alert("Failed to load resources. Please check your network or login status.");
    } finally {
      setLoading(false);
    }
  }, [authAxios, navigate]);

  // --- INIT: LOAD EVERYTHING ---
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    (async () => {
      await fetchTimeSettings();
      await fetchResourcesForGeneration();
    })();
  }, [fetchResourcesForGeneration, fetchTimeSettings, navigate]);

  // --- HANDLE GENERATION ---
  const handleGenerate = async () => {
    setIsGenerating(true);
    setTimetableData([]);

    if (!resources.assignments.length) {
      alert("Cannot generate timetable: No assignments found.");
      setIsGenerating(false);
      return;
    }

    if (!timeSettings) {
      alert("Please configure your time settings first!");
      setIsGenerating(false);
      return;
    }

    try {
      const res = await authAxios.post("/timetables/generate", {
        resources,
        timeSettings,
      });

      if (res.data?.schedule?.length) {
        setTimetableData(res.data.schedule);
        alert("✅ Timetable generated successfully!");
      } else {
        alert("⚠ No timetable generated. Please check your resources or settings.");
      }
    } catch (error) {
      console.error("Timetable generation failed:", error.response?.data?.msg || error);
      alert(
        `Timetable generation failed: ${
          error.response?.data?.msg || "Internal Server Error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // --- CONFLICT CHECK + DRAG-DROP LOGIC ---
  const checkConflicts = (targetDay, targetTimeSlot, classToMove) => {
    const conflicts = [];

    const teacherConflict = timetableData.find(
      (item) =>
        item.day === targetDay &&
        item.timeSlot === targetTimeSlot &&
        item.teacher._id === classToMove.teacher._id
    );
    if (teacherConflict)
      conflicts.push(
        `Teacher ${classToMove.teacher.initials} already has a class at this time.`
      );

    const roomConflict = timetableData.find(
      (item) =>
        item.day === targetDay &&
        item.timeSlot === targetTimeSlot &&
        item.room._id === classToMove.room._id
    );
    if (roomConflict)
      conflicts.push(`Room ${classToMove.room.name} is already occupied.`);

    const slotConflict = timetableData.find(
      (item) =>
        item.day === targetDay &&
        item.timeSlot === targetTimeSlot &&
        !(
          item.day === classToMove.day &&
          item.timeSlot === classToMove.timeSlot &&
          item.subject._id === classToMove.subject._id
        )
    );
    if (slotConflict)
      conflicts.push(`Slot already occupied by ${slotConflict.subject.code}.`);

    return conflicts;
  };

  const handleDrop = (e, targetDay, targetTimeSlot) => {
    e.preventDefault();
    const droppedClassData = JSON.parse(e.dataTransfer.getData("classData"));
    const sourceDay = droppedClassData.day;
    const sourceTimeSlot = droppedClassData.timeSlot;

    if (sourceDay === targetDay && sourceTimeSlot === targetTimeSlot) return;

    const conflicts = checkConflicts(targetDay, targetTimeSlot, droppedClassData);
    if (conflicts.length > 0) {
      alert("Cannot move class due to conflicts:\n- " + conflicts.join("\n- "));
      return;
    }

    setTimetableData((prevData) => {
      const newData = [...prevData];
      const sourceIndex = newData.findIndex(
        (item) => item.day === sourceDay && item.timeSlot === sourceTimeSlot
      );
      if (sourceIndex === -1) return prevData;
      const movingClass = newData[sourceIndex];
      const targetIndex = newData.findIndex(
        (item) => item.day === targetDay && item.timeSlot === targetTimeSlot
      );

      if (targetIndex !== -1) {
        const targetClass = newData[targetIndex];
        targetClass.day = sourceDay;
        targetClass.timeSlot = sourceTimeSlot;
        movingClass.day = targetDay;
        movingClass.timeSlot = targetTimeSlot;
        newData[sourceIndex] = targetClass;
        newData[targetIndex] = movingClass;
      } else {
        movingClass.day = targetDay;
        movingClass.timeSlot = targetTimeSlot;
      }
      return newData;
    });
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="p-8 text-center text-xl text-gray-700">
        Loading resources and settings...
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Timetable</h1>
      <Link
        to="/dashboard"
        className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
      >
        ← Back to Dashboard
      </Link>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={handleGenerate}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
          disabled={isGenerating || loading || !resources.assignments.length}
        >
          {isGenerating ? "Generating..." : "Auto Generate"}
        </button>
      </div>

      <hr className="my-6" />

      <TimetableGrid
        timetable={timetableData}
        onDrop={handleDrop}
        timetableSettings={timeSettings}
      />

      {timetableData.length > 0 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-400 text-green-700 rounded-md">
          ✅ Timetable generated and ready for editing. Drag and drop to adjust sessions.
        </div>
      )}
    </div>
  );
};

export default Timetable;
