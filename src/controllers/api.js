const uilityFunction = require('../../utils/utilityFunctions');
const WaveformSimulation = require('../models/SimulationWaveform');
const VitalSignSimulation = require('../models/SimulationVitalSign');

exports.getDevices = (req, res) => {
	return res.json(uilityFunction.apiOutputTemplate('success', 'success', process.devices));
};


exports.listSimulationWaveform = (req, res) => {
	WaveformSimulation.find({})
		.then((allWaveforms) => {
			console.log(allWaveforms);
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				waveforms: allWaveforms
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate("error", 'error', {
				err
			}));
		});
};

exports.postSimulationWaveform = (req, res) => {
	let promises = [];
	for (let type in req.body) {
		promises.push(WaveformSimulation.create({
			type: type,
			value: req.body[type]
		}));
	}
	Promise.all(promises)
		.then((createdWaveforms) => {
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				_id: createdWaveforms.map((createdWaveform) => createdWaveform._id)
			}));
		}).catch((err) => {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err
		}));
	});
};

exports.getSimulationWaveform = (req, res) => {
	WaveformSimulation.findOne({_id: req.params.waveform_id})
		.then((foundWaveform) => {
			console.log(foundWaveform);
			if (!foundWaveform) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
			}
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				waveform: foundWaveform
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};

exports.patchSimulationWaveform = (req, res) => {
	WaveformSimulation.findOne({_id: req.params.waveform_id})
		.then((foundWaveform) => {
			if (!foundWaveform) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not Found'));
			}
			for (let type in req.body) {
				foundWaveform.type = type || foundWaveform.type;
				foundWaveform.value = req.body[type] || foundWaveform.value;
			}
			return foundWaveform.save();
		})
		.then((savedFoundWaveform) => {
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				_id: savedFoundWaveform.id
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};

exports.deleteSimulationWaveform = (req, res) => {
	WaveformSimulation.remove({_id: req.params.waveform_id})
		.then((commonResult) => {
			if (commonResult.result.n === 0) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
			}
			console.log(commonResult);
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				count: commonResult.result.n
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};


exports.listSimulationVitalSign = (req, res) => {
	VitalSignSimulation.find({})
		.then((allVitalSigns) => {
			console.log(allVitalSigns);
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				vital_signs: allVitalSigns
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};

exports.postSimulationVitalSign = (req, res) => {
	let promises = [];
	for (let type in req.body) {
		promises.push(VitalSignSimulation.create({
			type: type,
			value: req.body[type].value,
			template: req.body[type].template
		}));
	}
	Promise.all(promises)
		.then((createdVitalSigns) => {
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				_id: createdVitalSigns.map((createdVitalSign) => createdVitalSign._id)
			}));
		}).catch((err) => {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err
		}));
	});
};

exports.getSimulationVitalSign = (req, res) => {
	VitalSignSimulation.findOne({_id: req.params.vital_signs_id})
		.then((foundVitalSign) => {
			console.log(foundVitalSign);
			if (!foundVitalSign) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
			}
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				vital_sign: foundVitalSign
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};


exports.patchSimulationVitalSign = (req, res) => {
	VitalSignSimulation.findOne({_id: req.params.vital_signs_id})
		.then((foundVitalSign) => {
			console.log(foundVitalSign);
			if (!foundVitalSign) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not Found'));
			}
			for (let type in req.body) {
				foundVitalSign.type = type || foundVitalSign.type;
				foundVitalSign.value = req.body[type].value || foundVitalSign.value;
				foundVitalSign.template = req.body[type].template || foundVitalSign.value;
			}
			return foundVitalSign.save();
		})
		.then((savedFoundVitalSign) => {
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				_id: savedFoundVitalSign.id
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};

exports.deleteSimulationVitalSign = (req, res) => {
	VitalSignSimulation.remove({_id: req.params.vital_signs_id})
		.then((commonResult) => {
			if (commonResult.result.n === 0) {
				return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
			}
			console.log(commonResult);
			return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
				count: commonResult.result.n
			}));
		})
		.catch((err) => {
			return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
				err
			}));
		});
};