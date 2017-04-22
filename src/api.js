const uilityFunction = require('../utils/utilityFunctions');
const util = require('util');
const express = require('express');
const app = express();

app.use(function(req, res, next) {
	const allowedOrigins = ['http://localhost:3000'];
	const origin = req.headers.origin;
	if(allowedOrigins.indexOf(origin) > -1){
		res.setHeader('Access-Control-Allow-Origin', origin);
	}

	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.header('Access-Control-Allow-Credentials', true);
	return next();
});


const api = express.Router();

api.get('/devices', (req, res) => {
	res.json(uilityFunction.apiOutputTemplate("success", 'success', process.devices));
});

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