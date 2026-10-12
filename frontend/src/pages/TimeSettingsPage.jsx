import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api/timesettings";

const TimeSettingsPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 60,
    breakStart: "11:00",
    breakEnd: "11:20",
    lunchStart: "13:00",
    lunchEnd: "14:10",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch saved settings on page load
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      try {
        const res = await axios.get(API_BASE_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data) {
          console.log("✅ Loaded time settings:", res.data);
          setFormData(res.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          console.log("ℹ No existing settings found. You can create new ones.");
        } else if (err.response?.status === 401) {
          alert("Authorization failed. Please login again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          console.error("❌ Failed to load settings:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  // ✅ Handle form field updates
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "workingDays") {
      const day = value;
      setFormData((prev) => ({
        ...prev,
        workingDays: checked
          ? [...prev.workingDays, day]
          : prev.workingDays.filter((d) => d !== day),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Save settings to backend
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(API_BASE_URL, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Time settings saved successfully!");
      console.log("Saved:", res.data);
    } catch (err) {
      console.error("❌ Error saving settings:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600 text-lg">
        Loading your saved time settings...
      </div>
    );
  }

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Time & Schedule Settings
      </h1>

      <button
        onClick={() => navigate("/dashboard")}
        className="text-blue-600 hover:text-blue-800 mb-6 inline-block"
      >
        ← Back to Dashboard
      </button>

      <form
        onSubmit={handleSave}
        className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Period Duration (minutes)
            </label>
            <input
              type="number"
              name="slotDuration"
              value={formData.slotDuration}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="30"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Break Start
            </label>
            <input
              type="time"
              name="breakStart"
              value={formData.breakStart}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Break End
            </label>
            <input
              type="time"
              name="breakEnd"
              value={formData.breakEnd}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Lunch Start
            </label>
            <input
              type="time"
              name="lunchStart"
              value={formData.lunchStart}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Lunch End
            </label>
            <input
              type="time"
              name="lunchEnd"
              value={formData.lunchEnd}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Working Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allDays.map((day) => (
              <label key={day} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="workingDays"
                  value={day}
                  checked={formData.workingDays.includes(day)}
                  onChange={handleChange}
                />
                <span>{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-5 py-2 rounded-md text-white font-semibold ${
              saving ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeSettingsPage;
