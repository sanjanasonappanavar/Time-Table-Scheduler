// backend/routes/crud.js 
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Import all models
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Room = require('../models/Room');
const Assignment = require('../models/Assignment');

// Map resource names to models
const modelMap = {
    subjects: Subject,
    teachers: Teacher,
    rooms: Room,
    assignments: Assignment,
};

// Route for all GET requests (fetch all resources of a type)
router.get('/:resourceType', authMiddleware, async (req, res) => {
    const resourceType = req.params.resourceType;
    const Model = modelMap[resourceType];

    if (!Model) {
        return res.status(404).json({ msg: 'Resource type not found' });
    }

    try {
        const items = await Model.find({ user: req.user.id }).sort({ name: 1 });
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route for all POST requests (create a new resource)
router.post('/:resourceType', authMiddleware, async (req, res) => {
    const resourceType = req.params.resourceType;
    let Model;
    let newResourceData;

    switch (resourceType) {
        case 'subjects':
            Model = Subject;
            // CRITICAL: Destructure and include weeklyHours here
            const {
                name: subjectName,
                code,
                weeklyHours,
                isLab = false,
                sessionDuration,
                labLocation = '',
                requiresBatching = false,
            } = req.body;
            newResourceData = {
                name: subjectName,
                code,
                weeklyHours,
                isLab,
                sessionDuration: sessionDuration || (isLab ? 2 : 1),
                labLocation: isLab ? labLocation : '',
                requiresBatching: isLab ? requiresBatching : false,
            };
            break;
        case 'teachers':
            Model = Teacher;
            const { name: teacherName, initials } = req.body;
            newResourceData = { name: teacherName, initials };
            break;
        case 'rooms':
            Model = Room;
            const { name: roomName, capacity } = req.body;
            newResourceData = { name: roomName, capacity };
            break;
        default:
            return res.status(400).json({ msg: 'Invalid resource type' });
    }

    try {
        const newItem = new Model({
            ...newResourceData,
            user: req.user.id
        });
        const item = await newItem.save();
        res.json(item);
    } catch (err) {
        console.error('Error creating resource:', err);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Resource already exists (duplicate key).' });
        }
        if (err.name === 'ValidationError') {
             return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
});

// Route for all DELETE requests (delete a resource)
router.delete('/:resourceType/:id', authMiddleware, async (req, res) => {
    const resourceType = req.params.resourceType;
    const Model = modelMap[resourceType];

    if (!Model) {
        return res.status(404).json({ msg: 'Resource type not found' });
    }

    try {
        // Find and remove by ID and user ID to ensure ownership
        const item = await Model.findOneAndDelete({ _id: req.params.id, user: req.user.id });

        if (!item) {
            return res.status(404).json({ msg: 'Resource not found or unauthorized' });
        }

        res.json({ msg: `${resourceType.slice(0, -1)} deleted successfully` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;