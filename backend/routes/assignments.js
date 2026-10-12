// backend/routes/assignments.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Assignment = require('../models/Assignment'); 

// @route   GET /api/assignments
// @desc    Get all assignments
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const assignments = await Assignment.find({ user: req.user.id })
            // Ensure you populate the teacher and subject names for the frontend display
            .populate('teacher', 'name initials') 
            .populate('subject', 'name code') 
            .sort({ teacher: 1 });
            
        res.json(assignments);
    } catch (err) {
        console.error('Error fetching assignments:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/assignments
// @desc    Create a new teacher-subject assignment
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    // CRITICAL: Keys must be 'teacher' and 'subject'
    const teacher = req.body.teacher || req.body.teacherId;
    const subject = req.body.subject || req.body.subjectId; 

    try {
        const newAssignment = new Assignment({
            teacher,
            subject,
            user: req.user.id
        });

        const assignment = await newAssignment.save();
        // Respond with the populated assignment so the frontend can display it immediately
        await assignment.populate([
             { path: 'teacher', select: 'name initials' }, 
             { path: 'subject', select: 'name code' }
        ]);

        res.json(assignment);
        
    } catch (err) {
        console.error('Error creating assignment:', err);
        // Catch the Mongoose duplicate key error (code 11000)
        if (err.code === 11000) { 
            return res.status(400).json({ msg: 'Assignment failed. Already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await Assignment.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!result) return res.status(404).json({ msg: 'Assignment not found or unauthorized' });
        
        res.json({ msg: 'Assignment removed successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;