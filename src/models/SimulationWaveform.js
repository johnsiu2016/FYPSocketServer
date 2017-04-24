const mongoose = require('mongoose');

const simulationWaveformSchema = new mongoose.Schema({
	type: String,
	value: [Number],
}, {timestamps: true});

const SimulationWaveform = mongoose.model('SimulationWaveform', simulationWaveformSchema);
module.exports = SimulationWaveform;
