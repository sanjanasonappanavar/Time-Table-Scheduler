const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Import Route Files ---
const authRoutes = require('./routes/auth');
const crudRoutes = require('./routes/crud');
const assignmentRoutes = require('./routes/assignments');
const timetableRoutes = require('./routes/timetables');
const timeSettingsRoutes = require('./routes/timeSettings'); // ✅ NEW ROUTE IMPORT

// --- Register Routes (Specific → General Order) ---

// 1️⃣ Authentication Routes
app.use('/api/auth', authRoutes);

// 2️⃣ Assignment Routes
app.use('/api/assignments', assignmentRoutes);

// 3️⃣ Timetable Routes
app.use('/api/timetables', timetableRoutes);

// 4️⃣ Time Settings Route (user-defined timing configuration)
app.use('/api/timesettings', timeSettingsRoutes); // ✅ NEWLY ADDED

// 5️⃣ Generic CRUD Routes (Subjects, Teachers, Rooms, etc.)
app.use('/api', crudRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('🧩 Timetable Generator API is running...');
});

// --- Global Error Handler (Optional) ---
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
