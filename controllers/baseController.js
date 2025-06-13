const Base = require('../models/Base');

// Create a new base
exports.createBase = async (req, res) => {
  try {
    const { base_name, location, description } = req.body;

    if (!base_name || !location) {
      return res.status(400).json({ error: 'Base name and location are required.' });
    }

    const newBase = await Base.create({ base_name, location, description });
    res.status(201).json(newBase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create base', details: error.message });
  }
};

// Get all bases
exports.getAllBases = async (req, res) => {
  try {
    const bases = await Base.getAll();
    res.status(200).json(bases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bases', details: error.message });
  }
};

// Get base by ID
exports.getBaseById = async (req, res) => {
  try {
    const { baseId } = req.params;
    const base = await Base.findById(baseId);

    if (!base) {
      return res.status(404).json({ error: 'Base not found' });
    }

    res.status(200).json(base);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch base', details: error.message });
  }
};

// Get bases for a specific user
exports.getUserBases = async (req, res) => {
  try {
    const { userId } = req.params;
    const bases = await Base.getUserBases(userId);
    res.status(200).json(bases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user bases', details: error.message });
  }
};
