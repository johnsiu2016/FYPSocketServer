const mongoose = require('mongoose');

const simulationVitalSignSchema = new mongoose.Schema({
	type: String,
	value: mongoose.Schema.Types.Mixed,
	template: String
}, {timestamps: true});


const SimulationVitalSign = mongoose.model('SimulationVitalSign', simulationVitalSignSchema);
module.exports = SimulationVitalSign;
