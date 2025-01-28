const { sendRequest, authenticate } = require('./services/api');
const fs = require('fs');
const path = require('path');

const createProject = async () => {
    try {
        const projectDataPath = path.join(__dirname, 'projectData.json');
        const rawData = fs.readFileSync(projectDataPath);
        const projectData = JSON.parse(rawData);

        const response = await sendRequest('POST', '/projects', projectData);
        console.log('API Response:', response);
    } catch (error) {
        console.error('Error posting data:', error.message);
    }
};

async function main() {
    await authenticate();
    await createProject();
}

main();
