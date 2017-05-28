'use strict';

var uilityFunction = require('../utils/utilityFunctions');
var WaveformSimulation = require('../models/SimulationWaveform');
var VitalSignSimulation = require('../models/SimulationVitalSign');

exports.getDevices = function (req, res) {
	return res.json(uilityFunction.apiOutputTemplate('success', 'success', process.devices));
};

exports.listSimulationWaveform = function (req, res) {
	WaveformSimulation.find({}).then(function (allWaveforms) {
		//console.log(allWaveforms);
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			waveforms: allWaveforms
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate("error", 'error', {
			err: err
		}));
	});
};

exports.postSimulationWaveform = function (req, res) {
	var promises = [];
	for (var type in req.body) {
		promises.push(WaveformSimulation.create({
			type: type,
			value: req.body[type]
		}));
	}
	Promise.all(promises).then(function (createdWaveforms) {
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			_id: createdWaveforms.map(function (createdWaveform) {
				return createdWaveform._id;
			})
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.getSimulationWaveform = function (req, res) {
	WaveformSimulation.findOne({ _id: req.params.waveform_id }).then(function (foundWaveform) {
		// console.log(foundWaveform);
		if (!foundWaveform) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
		}
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			waveform: foundWaveform
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.patchSimulationWaveform = function (req, res) {
	WaveformSimulation.findOne({ _id: req.params.waveform_id }).then(function (foundWaveform) {
		if (!foundWaveform) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not Found'));
		}
		// console.log(req.body)
		for (var type in req.body) {
			foundWaveform.type = type || foundWaveform.type;
			foundWaveform.value = req.body[type] || foundWaveform.value;
		}
		return foundWaveform.save();
	}).then(function (savedFoundWaveform) {
		// console.log(savedFoundWaveform)
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			_id: savedFoundWaveform.id
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.deleteSimulationWaveform = function (req, res) {
	WaveformSimulation.remove({ _id: req.params.waveform_id }).then(function (commonResult) {
		if (commonResult.result.n === 0) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
		}
		// console.log(commonResult);
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			count: commonResult.result.n
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.listSimulationVitalSign = function (req, res) {
	VitalSignSimulation.find({}).then(function (allVitalSigns) {
		// console.log(allVitalSigns);
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			vital_signs: allVitalSigns
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.postSimulationVitalSign = function (req, res) {
	var promises = [];
	for (var type in req.body) {
		promises.push(VitalSignSimulation.create({
			type: type,
			value: req.body[type].value,
			template: req.body[type].template
		}));
	}
	Promise.all(promises).then(function (createdVitalSigns) {
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			_id: createdVitalSigns.map(function (createdVitalSign) {
				return createdVitalSign._id;
			})
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.getSimulationVitalSign = function (req, res) {
	VitalSignSimulation.findOne({ _id: req.params.vital_signs_id }).then(function (foundVitalSign) {
		// console.log(foundVitalSign);
		if (!foundVitalSign) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
		}
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			vital_sign: foundVitalSign
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.patchSimulationVitalSign = function (req, res) {
	VitalSignSimulation.findOne({ _id: req.params.vital_signs_id }).then(function (foundVitalSign) {
		// console.log(foundVitalSign);
		if (!foundVitalSign) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not Found'));
		}
		for (var type in req.body) {
			foundVitalSign.type = type || foundVitalSign.type;
			foundVitalSign.value = req.body[type].value || foundVitalSign.value;
			foundVitalSign.template = req.body[type].template || foundVitalSign.value;
		}
		return foundVitalSign.save();
	}).then(function (savedFoundVitalSign) {
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			_id: savedFoundVitalSign.id
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.deleteSimulationVitalSign = function (req, res) {
	VitalSignSimulation.remove({ _id: req.params.vital_signs_id }).then(function (commonResult) {
		if (commonResult.result.n === 0) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'Not found'));
		}
		// console.log(commonResult);
		return res.json(uilityFunction.apiOutputTemplate('success', 'success', {
			count: commonResult.result.n
		}));
	}).catch(function (err) {
		return res.json(uilityFunction.apiOutputTemplate('error', 'error', {
			err: err
		}));
	});
};

exports.postWaveformRecording = function (req, res) {
	var deviceId = req.body.device_id;
	var sampleArray = req.body.sample_array;
	if (!process.devices[deviceId]) return res.json(uilityFunction.apiOutputTemplate('error', 'device not found'));

	if (!process.devices[deviceId]["recording"]) {
		process.devices[deviceId]["recording"] = {};
	}
	if (!process.devices[deviceId]["recording"]["sampleArray"]) {
		process.devices[deviceId]["recording"]["sampleArray"] = {};
	}

	Object.keys(sampleArray).map(function (formField) {
		var metric = formField.match(/(.*)_is_record/);
		if (metric) {
			return metric[1];
		}
	}).filter(function (metric) {
		return metric;
	}).forEach(function (metric) {
		if (process.devices[deviceId]["recording"]["sampleArray"][metric]) {
			return res.json(uilityFunction.apiOutputTemplate('error', 'The request metric have already been recording'));
		}

		console.log(metric);

		var name = req.body.sample_array[metric + '_record_name'];
		var duration = req.body.sample_array[metric + '_duration'];
		var frequency = process.devices[deviceId]["sampleArray"][metric].frequency;

		process.devices[deviceId]["recording"]["sampleArray"][metric] = true;
		setTimeout(function () {
			console.log(name + ' setTimeout');
			WaveformSimulation.create({
				type: 'record_' + frequency + '_' + name + '_' + duration + '_' + Math.random().toString(36).slice(-6),
				value: process.devices[deviceId]["sampleArray"][metric].value
			}).then(function () {
				delete process.devices[deviceId]["sampleArray"][metric];
				delete process.devices[deviceId]["recording"]["sampleArray"][metric];
			});
		}, duration * 60 * 1000);
	});

	return res.json(uilityFunction.apiOutputTemplate('success', 'success'));
};