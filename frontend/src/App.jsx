// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TimetableEditor from "./components/TimetableEditor"; // ✅ Load the working component
import TimeSettingsPage from './pages/TimeSettingsPage';

// --- AXIOS GLOBAL TOKEN INTERCEPTOR ---
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- PROTECTED ROUTE WRAPPER ---
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token");
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login isSignup={true} />} />

        {/* 🔒 Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        {/* 🧠 Updated Route: Use TimetableEditor instead of old Timetable.jsx */}
        <Route
          path="/timetable/:id"
          element={
            <PrivateRoute>
              <TimetableEditor />
            </PrivateRoute>
          }
        />
        <Route 
  path="/timesettings" 
  element={
    <PrivateRoute>
      <TimeSettingsPage />
    </PrivateRoute>
  } 
/>


        {/* 🏠 Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
