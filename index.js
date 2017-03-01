const env = process.env.NODE_ENV || 'development';
const src = env === 'production' ? './build/app.js' : './src/app.js';

if (env === 'development') {
    // for development use babel/register for faster runtime compilation
    require('babel-register');
}

require(src);