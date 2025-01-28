const axios = require('axios');
const config = require('../config/config');

let apiToken = null;

/**
 * Authenticate and get a Bearer token
 */
const authenticate = async () => {
    try {
        const response = await axios.post(`${config.apiUrl}/auth/key`, {
            key: config.apiKey
        });

        const data = response.data;
        if (data.token) {
            apiToken = data.token;
            console.log('Authenticated');
        } else {
            throw new Error('Authentication failed: No token received');
        }
    } catch (error) {
        console.error('Authentication Error:', error.response ? error.response.data : error.message);
    }
};

/**
 * General API Request Function with auto-reauthentication
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint (e.g., '/projects')
 * @param {object} data - Request payload
 * @param {boolean} retry - Internal flag to avoid infinite loop on re-authentication
 */
const sendRequest = async (method, endpoint, data = {}, retry = true) => {
    if (!apiToken) {
        console.log('Token missing, authenticating...');
        await authenticate();
    }

    try {
        const response = await axios({
            method,
            url: `${config.apiUrl}${endpoint}`,
            headers: { Authorization: `Bearer ${apiToken}` },
            data
        });

        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401 && retry) {
            console.log('Token expired. Re-authenticating...');
            await authenticate();
            return sendRequest(method, endpoint, data, false);
        }

        console.error(`API Error (${method} ${endpoint}):`, error.response ? error.response.data : error.message);
    }
};

module.exports = { authenticate, sendRequest };
