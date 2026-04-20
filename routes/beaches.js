const express = require('express');
const router = express.Router();

// Beach data (moved from beaches.js frontend file)
const BEACHES = require('../data/beaches.json');

// ==========================================
// GET ALL BEACHES
// ==========================================
router.get('/', (req, res) => {
    let beaches = [...BEACHES];
    const { state, activity, season, sort, search } = req.query;

    // Filter by state
    if (state && state !== 'all') {
        beaches = beaches.filter(b => b.state === state);
    }

    // Filter by activity
    if (activity && activity !== 'all') {
        beaches = beaches.filter(b =>
            b.activities.some(a => a.toLowerCase().includes(activity.toLowerCase()))
        );
    }

    // Filter by season
    if (season && season !== 'all') {
        beaches = beaches.filter(b => b.bestTime === season);
    }

    // Search
    if (search) {
        const query = search.toLowerCase();
        beaches = beaches.filter(b =>
            b.name.toLowerCase().includes(query) ||
            b.state.toLowerCase().includes(query) ||
            b.location.toLowerCase().includes(query) ||
            b.activities.some(a => a.toLowerCase().includes(query)) ||
            b.description.toLowerCase().includes(query)
        );
    }

    // Sort
    switch (sort) {
        case 'name':
            beaches.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'state':
            beaches.sort((a, b) => a.state.localeCompare(b.state));
            break;
        case 'rating':
        default:
            beaches.sort((a, b) => b.rating - a.rating);
            break;
    }

    res.json({ beaches, total: beaches.length });
});

// ==========================================
// GET SINGLE BEACH
// ==========================================
router.get('/:id', (req, res) => {
    const beach = BEACHES.find(b => b.id === parseInt(req.params.id));
    if (!beach) {
        return res.status(404).json({ error: 'Beach not found' });
    }
    res.json({ beach });
});

module.exports = router;
