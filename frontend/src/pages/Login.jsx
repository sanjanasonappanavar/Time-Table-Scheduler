// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

// Inline SVG calendar icon component (avoids external dependency)
const CalendarIcon = ({ className = '', size = 28 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/auth/signin' : '/auth/signup';

    try {
      const res = await axios.post(API_BASE_URL + endpoint, { email, password });

      // Save token and navigate
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'Request failed. Check console.';
      alert(errorMessage);
      console.error(errorMessage, err);
    }
  };

  return (
     <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="p-8 bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 text-white mb-3">
            <CalendarIcon size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Timetable <span className="text-blue-500">Generator</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Create and manage college timetables 
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 font-medium transition-colors duration-200 ${
              isLogin ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 font-medium transition-colors duration-200 ${
              !isLogin ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
