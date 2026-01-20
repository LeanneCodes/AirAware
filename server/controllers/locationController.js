require('dotenv').config();

const Location = require('../models/Location');

async function getLocation(req, res) {
    const data = req.body;
    try {
        const location = await Location.getLocation(data)
        
    } catch (err) {
        res.status(401).json({error: err.message})
    }
}

module.exports = { getLocation }