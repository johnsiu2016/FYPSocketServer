'use strict';

var mongoose = require('mongoose');

var simulationWaveformSchema = new mongoose.Schema({
	type: String,
	value: [Number]
}, { timestamps: true });

var SimulationWaveform = mongoose.model('SimulationWaveform', simulationWaveformSchema);
module.exports = SimulationWaveform;