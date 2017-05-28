'use strict';

var mongoose = require('mongoose');

var simulationVitalSignSchema = new mongoose.Schema({
	type: String,
	value: mongoose.Schema.Types.Mixed,
	template: String
}, { timestamps: true });

var SimulationVitalSign = mongoose.model('SimulationVitalSign', simulationVitalSignSchema);
module.exports = SimulationVitalSign;