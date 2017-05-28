'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.apiOutputTemplate = apiOutputTemplate;
exports.requestWaveformDataInterval = requestWaveformDataInterval;
exports.calculateECGArray = calculateECGArray;
exports.interpolateArray = interpolateArray;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function apiOutputTemplate(type, message, data) {
    return {
        status: {
            type: type,
            message: message
        },
        response: _extends({}, data)
    };
}

function requestWaveformDataInterval(type, second, cb) {
    var execCalculateECGArray = calculateECGArray(type);
    return setInterval(function () {
        requestSimulationModeWaveformData(execCalculateECGArray).then(function (waveformData) {
            cb(waveformData);
        });
    }, second);
}

function requestSimulationModeWaveformData(execCalculateECGArray) {
    return new Promise(function (resolve) {
        return resolve(execCalculateECGArray(window._HR || 120));
    });
}

var rawWaveformDataLookUpTable = {
    'ECG - II': [0, 0, 0.0000050048828125, 0.0000137939453125, 0.000049560546875, 0.00008740234375, 0.00015966796875, 0.000262451171875, 0.0003975830078125, 0.0005687255859375, 0.0007802734375, 0.001037353515625, 0.0013468017578125, 0.00172119140625, 0.0021756591796875, 0.0027232666015625, 0.0033880615234375, 0.004206787109375, 0.0052380371093750005, 0.006586181640625, 0.008400146484375001, 0.010904296875, 0.0144892578125, 0.0196798095703125, 0.049684204101562504, 0.0886883544921875, 0.11185363769531251, 0.134164306640625, 0.137352294921875, 0.1160369873046875, 0.08516308593750001, 0.0539765625, 0.014997436523437501, -0.015882568359375, -0.0387554931640625, -0.06125732421875, -0.0745780029296875, -0.07479357910156251, -0.0725338134765625, -0.0418538818359375, 0.08582861328125001, 0.397717529296875, 0.8136408691406251, 1.2295617980957032, 0.9944150390625001, 0.2824605712890625, -0.38949267578125, -0.597251220703125, -0.425675537109375, -0.1537947998046875, -0.0500914306640625, -0.0111041259765625, 0.0027451171875, 0.0071739501953125, 0.008443359375, 0.0094327392578125, 0.012530517578125, 0.0176046142578125, 0.0300162353515625, 0.0433489990234375, 0.056962646484375004, 0.0704832763671875, 0.0770511474609375, 0.0898175048828125, 0.10311853027343751, 0.117046142578125, 0.1312630615234375, 0.1529300537109375, 0.167607177734375, 0.1899068603515625, 0.2124422607421875, 0.235044677734375, 0.2575535888671875, 0.2724073486328125, 0.286978271484375, 0.3007579345703125, 0.3067425537109375, 0.3106370849609375, 0.303756103515625, 0.2897236328125, 0.25916931152343753, 0.2200599365234375, 0.1728209228515625, 0.133416259765625, 0.086224853515625, 0.05493408203125, 0.02409423828125, 0.00922607421875, -0.0043409423828125, -0.0097349853515625, -0.013127685546875, -0.01423095703125, -0.013834716796875, -0.012556030273437501, -0.010675048828125, -0.00835888671875, -0.0057305908203125, -0.0000562744140625, 0, 0],
    "PPG": [-0.615617, -0.593225, -0.561621, -0.520447, -0.4697, -0.409714, -0.341109, -0.264733, -0.181634, -0.0930303, -0.000284727, 0.0951251, 0.19164, 0.287667, 0.381656, 0.472156, 0.557875, 0.637704, 0.710714, 0.776128, 0.833297, 0.881714, 0.921045, 0.951157, 0.972135, 0.984253, 0.987913, 0.983624, 0.971983, 0.953633, 0.929243, 0.899507, 0.865121, 0.826765, 0.785082, 0.740661, 0.694015, 0.645587, 0.59582, 0.545196, 0.494246, 0.443533, 0.393608, 0.344981, 0.298127, 0.253494, 0.211507, 0.172554, 0.136978, 0.105059, 0.0770082, 0.0529552, 0.0329633, 0.0170408, 0.00512365, -0.00293051, -0.00733322, -0.00836638, -0.00638339, -0.00180418, 0.00489955, 0.0132056, 0.0225461, 0.0323575, 0.0421177, 0.0513493, 0.0596349, 0.0666362, 0.0720919, 0.0758241, 0.0777405, 0.0777992, 0.0759569, 0.0721549, 0.0663167, 0.058373, 0.0483321, 0.0363186, 0.0225527, 0.00728563, -0.00926222, -0.0269201, -0.0455507, -0.0650429, -0.0853176, -0.106298, -0.127884, -0.149957, -0.172377, -0.194996, -0.217691, -0.240364, -0.26293, -0.285325, -0.30749, -0.329363, -0.350911, -0.37213, -0.393034, -0.413638, -0.433932, -0.453862, -0.473337, -0.492255, -0.510515, -0.528009, -0.544592, -0.56005, -0.574047, -0.586056, -0.595292, -0.600716, -0.601094],
    'RBBB': [-0.038147, -0.0387573, -0.039978, -0.0384521, -0.0363159, -0.0317383, -0.0238037, -0.0134277, -0.00274658, 0.0088501, 0.0192261, 0.0296021, 0.0357056, 0.0393677, 0.0393677, 0.0369263, 0.0311279, 0.020752, 0.00579834, -0.0088501, -0.022583, -0.0320435, -0.0390625, -0.0402832, -0.0384521, -0.0350952, -0.0320435, -0.0308228, -0.0311279, -0.0317383, -0.0338745, -0.0396729, -0.0479126, -0.0405884, 0.00427246, 0.101929, 0.232849, 0.35553, 0.430603, 0.446472, 0.414429, 0.352783, 0.266113, 0.159912, 0.0454712, -0.0549316, -0.124817, -0.159912, -0.169373, -0.162354, -0.147705, -0.13031, -0.115356, -0.100708, -0.088501, -0.078125, -0.0701904, -0.0683594, -0.0723267, -0.078125, -0.0827026, -0.0820923, -0.0808716, -0.078125, -0.0750732, -0.0708008, -0.065918, -0.0604248, -0.0558472, -0.0500488, -0.0442505, -0.0357056, -0.0259399, -0.0115967, 0.00488281, 0.0228882, 0.0405884, 0.0552368, 0.0662231, 0.0741577, 0.0799561, 0.085144, 0.0888062, 0.0930786, 0.09552, 0.0967407, 0.0961304, 0.0924683, 0.0848389, 0.0732422, 0.0582886, 0.0421143, 0.0238037, 0.00579834, -0.0140381, -0.0338745, -0.0491333, -0.0567627, -0.0585938, -0.0570679],
    'Bigeminy': [0.00366211, 0.00579834, 0.00732422, 0.00671387, 0.00549316, 0.00335693, 0.000915527, 0, -0.000610352, 0.000915527, 0.00274658, 0.00518799, 0.00854492, 0.0137329, 0.0216675, 0.0305176, 0.0402832, 0.0518799, 0.0622559, 0.0708008, 0.0744629, 0.0747681, 0.071106, 0.0619507, 0.0482178, 0.0317383, 0.0152588, 0.00335693, -0.00610352, -0.0100708, -0.0109863, -0.00854492, -0.00610352, -0.00579834, -0.00671387, -0.0088501, -0.0109863, -0.012207, -0.0183105, -0.0238037, -0.0140381, 0.0344849, 0.134583, 0.264282, 0.38208, 0.45105, 0.455017, 0.39856, 0.287781, 0.150146, 0.0259399, -0.0469971, -0.0650024, -0.0561523, -0.0473022, -0.0473022, -0.0506592, -0.0515747, -0.0509644, -0.0482178, -0.0457764, -0.0427246, -0.0405884, -0.039978, -0.039978, -0.0405884, -0.0424194, -0.0411987, -0.0375366, -0.0299072, -0.0201416, -0.00854492, 0.00396729, 0.0161743, 0.0280762, 0.0390625, 0.0482178, 0.057373, 0.0653076, 0.0738525, 0.0814819, 0.0888062, 0.0939941, 0.0961304, 0.0964355, 0.0946045, 0.0909424, 0.0872803, 0.0814819, 0.0753784, 0.0662231, 0.0552368, 0.0415039, 0.0244141, 0.00366211, -0.0195313, -0.043335, -0.0595093, -0.0665283, -0.0646973, -0.0598145, -0.055542, -0.0534058, -0.0524902, -0.0524902, -0.0531006, -0.0549316, -0.0549316, -0.0549316, -0.0524902, -0.0500488, -0.0469971, -0.0445557, -0.0436401, -0.0436401, -0.0445557, -0.0466919, -0.0466919, -0.0466919, -0.0445557, -0.0424194, -0.0418091, -0.0469971, -0.0546265, -0.0524902, -0.0253296, 0.0338745, 0.126953, 0.245972, 0.376892, 0.496216, 0.584717, 0.635071, 0.65033, 0.634766, 0.588989, 0.511169, 0.405273, 0.273743, 0.137329, 0.0164795, -0.0695801, -0.116882, -0.135193, -0.136108, -0.132751, -0.132751, -0.135498, -0.140076, -0.143127, -0.147095, -0.151062, -0.15686, -0.1651, -0.175781, -0.187988, -0.201416, -0.212402, -0.222473, -0.229187, -0.234985, -0.238953, -0.24231, -0.246582, -0.250854, -0.254822, -0.259399, -0.26123, -0.262146, -0.259705, -0.256653, -0.252075, -0.247498, -0.243225, -0.239258, -0.23468, -0.229797, -0.222473, -0.213928, -0.202026, -0.188293, -0.172424, -0.155945, -0.140381, -0.124207, -0.107727, -0.0912476, -0.0723267, -0.0527954, -0.0305176, -0.00976563, 0.00732422, 0.0180054, 0.0213623, 0.0204468, 0.0177002, 0.0140381, 0.0128174]
};
var formatZeroPointWaveform = interpolateArray([0], 120);

var formatWaveformLookUpTable = {};
var normalizedWaveformLookUpTable = {};
var repeatNormalizedWaveformLookUpTable = {};
for (var waveform in rawWaveformDataLookUpTable) {
    var cur = rawWaveformDataLookUpTable[waveform];
    var formatLength = 120 * Math.ceil(cur.length / 120);
    var formatWaveform = interpolateArray(cur, formatLength);
    var max = Math.min.apply(Math, _toConsumableArray(cur));
    var min = Math.max.apply(Math, _toConsumableArray(cur));
    var dataHeight = max - min;
    var normalizedWaveform = [];

    formatWaveformLookUpTable[waveform] = formatWaveform;
    for (var i = 0, len = formatWaveform.length; i < len; i++) {
        normalizedWaveform.push((formatWaveform[i] - min) / dataHeight);
    }
    normalizedWaveformLookUpTable[waveform] = normalizedWaveform;
    repeatNormalizedWaveformLookUpTable[waveform] = normalizedWaveform.concat(normalizedWaveform).concat(normalizedWaveform).concat(normalizedWaveform);
}

function calculateECGArray(type) {
    var normalizedWaveform = normalizedWaveformLookUpTable[type];
    var repeatNormalizedWaveform = repeatNormalizedWaveformLookUpTable[type];
    var baseDataLength = repeatNormalizedWaveform.length;

    var splitPoint = 0;
    return function (HR) {
        if (HR === 0) {
            return formatZeroPointWaveform;
        }

        var HRDataLength = HR / 60 * normalizedWaveform.length;
        var numberOfMovingPoint = HRDataLength >= 120 ? HRDataLength - normalizedWaveform.length : HRDataLength;
        var outputDataLength = 120 * Math.ceil(HRDataLength / 120);

        var resultArray = repeatNormalizedWaveform.slice(splitPoint, splitPoint + HRDataLength).concat(repeatNormalizedWaveform.slice(0, Math.max(splitPoint + HRDataLength - baseDataLength, 0)));
        splitPoint = splitPoint + numberOfMovingPoint;
        if (splitPoint >= baseDataLength) splitPoint = splitPoint - baseDataLength;
        var formatResultArray = interpolateArray(resultArray, outputDataLength);

        if (type === "PPG") {
            var ABPHeight = window._ABPHeight || 150;
            var ABPSystolic = window._ABPSystolic || 150;
            var dc = (150 - ABPSystolic) / 150;

            return formatResultArray.map(function (dataPoint) {
                return dataPoint * (ABPHeight / 150) + dc;
            });
        }
        // console.log(normalizedWaveform.length)
        // console.log(splitPoint)
        // console.log(resultArray.length)
        // console.log(outputDataLength)
        return formatResultArray;
    };
}

function interpolateArray(data, fitCount) {

    var linearInterpolate = function linearInterpolate(before, after, atPoint) {
        return before + (after - before) * atPoint;
    };

    var newData = [];
    var springFactor = (data.length - 1) / (fitCount - 1);
    newData[0] = data[0]; // for new allocation
    for (var _i = 1; _i < fitCount - 1; _i++) {
        var tmp = _i * springFactor;
        var before = Math.floor(tmp);
        var after = Math.ceil(tmp);
        var atPoint = tmp - before;
        newData[_i] = linearInterpolate(data[before], data[after], atPoint);
    }
    newData[fitCount - 1] = data[data.length - 1]; // for new allocation
    return newData;
}

var vitalSignData1 = {
    'HR': {
        'top': 130,
        'bottom': 50,
        'data': 80
    },
    'SpO2': {
        'top': 100,
        'bottom': 90,
        'data': 95
    },
    'RP': {
        'top': 45,
        'bottom': 10,
        'data': 42
    },
    'ABP': {
        'systolic': 120,
        'diastolic': 80,
        'mean': 91
    },
    'PAP': {
        'systolic': 30,
        'diastolic': 16,
        'mean': 22
    },
    'NBP': {
        'systolic': 122,
        'diastolic': 81,
        'mean': 92
    }
};

var vitalSignData2 = {
    'HR': {
        'top': 120,
        'bottom': 50,
        'data': 70
    },
    'SpO2': {
        'top': 100,
        'bottom': 90,
        'data': 99
    },
    'RP': {
        'top': 45,
        'bottom': 10,
        'data': 30
    },
    'ABP': {
        'systolic': 125,
        'diastolic': 83,
        'mean': 95
    },
    'PAP': {
        'systolic': 35,
        'diastolic': 19,
        'mean': 24
    },
    'NBP': {
        'systolic': 122,
        'diastolic': 83,
        'mean': 91
    }
};