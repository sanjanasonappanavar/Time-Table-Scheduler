// frontend/src/components/ResourceModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const ResourceModal = ({ type, isOpen, onClose, onResourceAdded }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState(''); 
  const [weeklyHours, setWeeklyHours] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [isLab, setIsLab] = useState(false); 
  
  const [labLocation, setLabLocation] = useState('');
  const [requiresBatching, setRequiresBatching] = useState(false); 

  const title = `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const codeLabel = type === 'subject' ? 'Code (e.g., CS101, C Lab)' : 
                    type === 'teacher' ? 'Initials (e.g., AP)' : 
                    'Capacity (Number)';
  const namePlaceholder = type === 'room' ? 'e.g., A-101' : 
                          type === 'teacher' ? 'e.g., Dr. Smith' : 
                          'e.g., Calculus or C Programming';
  const nameLabel = type === 'room' ? 'Room Name/Number' : 'Name';

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'x-auth-token': localStorage.getItem('token') }
  });

  const handleSubjectPayload = () => {
      const payload = { 
          name, 
          code,
          weeklyHours: parseInt(weeklyHours, 10),
          isLab: isLab,
          // Sending duration explicitly: 2 for lab, 1 for theory
          sessionDuration: isLab ? 2 : 1, 
          // ------------------------------------------------------------------------
          labLocation: isLab ? labLocation : '', // Only include if it is a lab
          requiresBatching: isLab ? requiresBatching : false,
      };

      // Frontend Validation: If it's a lab, location is required.
      if (isLab && !labLocation.trim()) {
           throw new Error("Specific Lab Location is required for lab subjects.");
      }
      return payload;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        let payload = { name }; 

        if (type === 'room') {
            payload.capacity = code;
        } else if (type === 'teacher') {
            payload.initials = code;
        } else if (type === 'subject') {
            payload = handleSubjectPayload(); 
        }

        const res = await authAxios.post(`/${type}s`, payload);
        
        onResourceAdded(type, res.data); 
        
        // Reset state
        onClose();
        setName('');
        setCode('');
        setWeeklyHours(''); 
        setIsLab(false); 
        setLabLocation('');
        setRequiresBatching(false);

    } catch (err) {
        const errorMsg = err.message.includes("Lab location") 
            ? err.message 
            : err.response?.data?.msg || 'Failed to create resource. Server Error.';
        
        alert(`Error: ${errorMsg}`); 
        console.error('Resource creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl">
          &times;
        </button>

        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">{nameLabel}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={namePlaceholder} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">{codeLabel}</label>
            <input type={type === 'room' ? 'number' : 'text'} value={code} onChange={(e) => setCode(e.target.value)}
              placeholder={type === 'room' ? 'e.g., 40' : 'e.g., AP'} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required min={type === 'room' ? 1 : undefined} />
          </div>

          {/* --- SUBJECT-SPECIFIC FIELDS --- */}
          {type === 'subject' && (
              <>
              <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Weekly Hours Required</label>
                  <input type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)}
                      placeholder="e.g., 3 or 4" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required min="1" />
              </div>

              {/* Is Lab Checkbox - This is the optional part */}
              <div className="mb-4 flex items-center">
                  <input type="checkbox" id="isLab" checked={isLab} onChange={(e) => setIsLab(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="isLab" className="ml-2 text-sm text-gray-700 font-bold">
                      Is this a Laboratory Class? (2-hour consecutive slot required)
                  </label>
              </div>

              {/* Lab-Specific Fields (Conditionally Rendered) */}
              {isLab && (
                  <div className="border p-4 rounded-lg bg-gray-50 mt-2">
                      <h4 className="text-md font-semibold mb-3 text-gray-700">Lab Configuration</h4>
                      
                      {/* Lab Location Input */}
                      <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2">Specific Lab Location (e.g., Lab Sankalpa)</label>
                          <input type="text" value={labLocation} onChange={(e) => setLabLocation(e.target.value)}
                              placeholder="e.g., Lab Sankalpa" className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required={isLab} // Required ONLY if lab box is checked
                          />
                      </div>
                      
                      {/* Batching Checkbox */}
                      <div className="flex items-center">
                          <input type="checkbox" id="requiresBatching" checked={requiresBatching} onChange={(e) => setRequiresBatching(e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                          <label htmlFor="requiresBatching" className="ml-2 text-sm text-gray-700">
                              Requires Batching (Splits class into Lab A and Lab B)
                          </label>
                      </div>
                  </div>
              )}
              </>
          )}
          {/* ----------------------------------- */}

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold disabled:bg-gray-400 mt-6" disabled={loading}>
            {loading ? 'Saving...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;