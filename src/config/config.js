require('dotenv').config({ path: '../.env' });

const config = {
    apiUrl: process.env.API_URL,
    apiKey: process.env.API_KEY
};

module.exports = config;
