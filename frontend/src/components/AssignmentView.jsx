// frontend/src/components/AssignmentView.jsx (Final Version)
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const AssignmentView = ({ assignments, teachers, subjects, onAssignmentUpdated }) => {
    // State to hold the IDs selected in the dropdowns
    const [teacherId, setTeacherId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [loading, setLoading] = useState(false);

    // Axios instance configured with the JWT token
    const authAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: { 'x-auth-token': localStorage.getItem('token') }
    });

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!teacherId || !subjectId) {
            alert('Please select both a teacher and a subject.');
            setLoading(false);
            return;
        }

        try {
            // CRITICAL: Payload keys MUST be 'teacher' and 'subject'
            await authAxios.post('/assignments', { 
                teacher: teacherId, 
                subject: subjectId 
            });
            
            // Refresh the entire dashboard data to see the new assignment
            onAssignmentUpdated(); 
            
            // Reset the form
            setTeacherId('');
            setSubjectId('');
        } catch (err) {
            // Display the specific validation error message from the backend
            const errorMessage = err.response?.data?.msg || 'Assignment creation failed. Server Error.';
            alert(`Error: ${errorMessage}`);
            console.error('Assignment creation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to unassign this subject?")) return;

        try {
            await authAxios.delete(`/assignments/${id}`);
            onAssignmentUpdated(); // Refresh the entire dashboard data
        } catch (err) {
            alert('Failed to delete assignment.');
            console.error('Assignment deletion error:', err);
        }
    };

    // --- RENDER LOGIC (Dropdowns and List) ---

    // Filter out items that might not have been fully created yet
    const availableTeachers = teachers.filter(t => t._id);
    const availableSubjects = subjects.filter(s => s._id);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            {/* Assignment Creation Form */}
            <form onSubmit={handleCreateAssignment} className="flex flex-wrap items-end gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
                
                {/* Teacher Dropdown */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Teacher</label>
                    <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        disabled={loading || availableTeachers.length === 0}
                    >
                        <option value="">Select Teacher</option>
                        {availableTeachers.map(teacher => (
                            <option key={teacher._id} value={teacher._id}>
                                {teacher.name} ({teacher.initials})
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Subject Dropdown */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                        disabled={loading || availableSubjects.length === 0}
                    >
                        <option value="">Select Subject</option>
                        {availableSubjects.map(subject => (
                            <option key={subject._id} value={subject._id}>
                                {subject.name} ({subject.code})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Assign Button */}
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
                    disabled={loading || availableTeachers.length === 0 || availableSubjects.length === 0}
                >
                    {loading ? 'Assigning...' : 'Assign Subject'}
                </button>
            </form>

            {/* List of Current Assignments */}
            <h4 className="text-lg font-semibold mb-3">Current Assignments:</h4>
            {assignments.length > 0 ? (
                <ul className="space-y-2">
                    {assignments.map(assignment => (
                        <li key={assignment._id} className="flex justify-between items-center p-3 bg-gray-50 border rounded-md">
                            <span>
                                <span className="font-medium text-blue-700">{assignment.teacher?.name}</span> 
                                {' teaches '}
                                <span className="font-medium text-green-700">{assignment.subject?.name} ({assignment.subject?.code})</span>
                            </span>
                            <button
                                onClick={() => handleDeleteAssignment(assignment._id)}
                                className="text-red-500 hover:text-red-700 transition"
                                title="Unassign Subject"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No assignments have been made yet.</p>
            )}
        </div>
    );
};

export default AssignmentView;