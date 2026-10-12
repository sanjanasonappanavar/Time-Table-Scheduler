// frontend/src/components/AddAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from './Modal';

const API_BASE_URL = 'http://localhost:5000/api';

const AddAssignmentModal = ({ onClose, onAssignmentAdded }) => {
  const [teacherId, setTeacherId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [resources, setResources] = useState({ teachers: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'x-auth-token': localStorage.getItem('token') }
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [teachersRes, subjectsRes] = await Promise.all([
          authAxios.get('/teachers'),
          authAxios.get('/subjects'),
        ]);
        setResources({ teachers: teachersRes.data, subjects: subjectsRes.data });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId || !subjectId) return alert('Please select both a teacher and a subject.');

    try {
      const res = await authAxios.post('/assignments', { teacherId, subjectId });
      onAssignmentAdded(res.data); // Calls the parent function to update the list
    } catch (err) {
      alert(err.response?.data?.msg || 'Error creating assignment.');
      console.error(err);
    }
  };

  if (loading) return <Modal title="Loading..." onClose={onClose}><p>Fetching data...</p></Modal>;

  return (
    <Modal title="Assign Subject to Teacher" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Teacher</option>
            {resources.teachers.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Subject</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Subject</option>
            {resources.subjects.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Confirm Assignment
        </button>
      </form>
    </Modal>
  );
};

export default AddAssignmentModal;