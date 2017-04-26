const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const logger = require('morgan');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/patientMonitor');
mongoose.connection.on('error', () => {
	console.log('MongoDB connection error. Please make sure MongoDB is running.');
	process.exit();
});

app.use(function(req, res, next) {
	const allowedOrigins = ['http://localhost:3000'];
	const origin = req.headers.origin;
	if(allowedOrigins.indexOf(origin) > -1){
		res.setHeader('Access-Control-Allow-Origin', origin);
	}

	res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, PATCH');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Credentials', true);
	return next();
});

const apiController = require('./controllers/api');
const api = express.Router();

api.get('/devices', apiController.getDevices);

api.get('/simulation/waveforms/find', apiController.listSimulationWaveform);
api.post('/simulation/waveforms', apiController.postSimulationWaveform);
api.get('/simulation/waveforms/:waveform_id', apiController.getSimulationWaveform);
api.patch('/simulation/waveforms/:waveform_id', apiController.patchSimulationWaveform);
api.delete('/simulation/waveforms/:waveform_id', apiController.deleteSimulationWaveform);

api.get('/simulation/vital_signs/find', apiController.listSimulationVitalSign);
api.post('/simulation/vital_signs', apiController.postSimulationVitalSign);
api.get('/simulation/vital_signs/:vital_signs_id', apiController.getSimulationVitalSign);
api.patch('/simulation/vital_signs/:vital_signs_id', apiController.patchSimulationVitalSign);
api.delete('/simulation/vital_signs/:vital_signs_id', apiController.deleteSimulationVitalSign);

api.use(handleAPIError);
app.use('/api', api);
function handleAPIError(err, req, res, next) {
	let message = "";
	switch (err.status) {
		default:
			console.log(err);
			message = "Unknown error";
			break;
	}
	return res.json(uilityFunction.apiOutputTemplate("error", 'error', message));
}

app.listen(4000, () => {

});