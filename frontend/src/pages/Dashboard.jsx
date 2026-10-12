import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ResourceCard from '../components/ResourceCard';
import AssignmentView from '../components/AssignmentView';
import ResourceModal from '../components/ResourceModal';

const API_BASE_URL = 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();

  // --- State Management ---
  const [data, setData] = useState({
    subjects: [],
    teachers: [],
    rooms: [],
    assignments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentResourceType, setCurrentResourceType] = useState('');

  // --- Modal Handlers ---
  const handleOpenModal = (type) => {
    setCurrentResourceType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentResourceType('');
  };

  // --- Fetch All Data ---
  const fetchAllResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, teachersRes, roomsRes, assignmentsRes] = await Promise.all([
        axios.get(API_BASE_URL + '/subjects'),
        axios.get(API_BASE_URL + '/teachers'),
        axios.get(API_BASE_URL + '/rooms'),
        axios.get(API_BASE_URL + '/assignments'),
      ]);

      setData({
        subjects: subjectsRes.data,
        teachers: teachersRes.data,
        rooms: roomsRes.data,
        assignments: assignmentsRes.data,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchAllResources();
  }, [fetchAllResources, navigate]);

  // --- Resource Handlers ---
  const handleResourceAdded = (type, newItem) => {
    setData((prev) => ({
      ...prev,
      [type + 's']: [...prev[type + 's'], newItem],
    }));
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await axios.delete(API_BASE_URL + `/${type}s/${id}`);
      setData((prev) => ({
        ...prev,
        [type + 's']: prev[type + 's'].filter((item) => item._id !== id),
      }));
    } catch (err) {
      alert('Failed to delete resource. Check if it is assigned to a timetable.');
      console.error(`Error deleting ${type}:`, err);
    }
  };

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // --- Render ---
  if (loading) {
    return <div className="text-center p-8 text-xl">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-600 text-xl">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="p-4 bg-white shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Timetable System</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <h2 className="text-3xl font-semibold mb-2">Resource Management</h2>
        <p className="text-gray-600 mb-6">
          Create and manage core entities (subjects, teachers, rooms).
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => navigate('/timetable/new')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Manage Timetables
          </button>

          {/* ✅ NEW BUTTON: Time Settings */}
          <button
            onClick={() => navigate('/timesettings')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Manage Time Settings
          </button>
        </div>

        {/* The three-column resource layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ResourceCard
            title="Subjects"
            subtitle="Course subjects"
            items={data.subjects}
            type="subject"
            onDelete={handleDelete}
            onAdd={() => handleOpenModal('subject')}
          />

          <ResourceCard
            title="Teachers"
            subtitle="Teaching staff"
            items={data.teachers}
            type="teacher"
            onDelete={handleDelete}
            onAdd={() => handleOpenModal('teacher')}
          />

          <ResourceCard
            title="Rooms"
            subtitle="Classrooms"
            items={data.rooms}
            type="room"
            onDelete={handleDelete}
            onAdd={() => handleOpenModal('room')}
          />
        </div>

        {/* Assignments Section */}
        <div className="mt-10">
          <h2 className="text-3xl font-semibold mb-4">Teacher-Subject Assignments</h2>
          <p className="text-gray-600 mb-4">Assign subjects to teachers</p>

          <AssignmentView
            assignments={data.assignments}
            teachers={data.teachers}
            subjects={data.subjects}
            onAssignmentUpdated={fetchAllResources}
          />
        </div>
      </div>

      {/* Resource Modal */}
      <ResourceModal
        type={currentResourceType}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onResourceAdded={handleResourceAdded}
      />
    </div>
  );
};

export default Dashboard;
