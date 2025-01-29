const { sendRequest, authenticate } = require('./services/api');

const createProject = async (url) => {
    try {
        let scannedUrls = await fetchUrls(url);

        const projectData = {
            'baseUrl': url,
            'name': url,
            'scanUrl': url,
            urls: scannedUrls['urls'],
        }

        return await sendRequest('POST', '/projects', projectData);
    } catch (error) {
        console.error('Error posting data:', error.message);
    }
};

const createSnapshot = async (projectId, environment = 'production') => {
    return await sendRequest('POST', `/projects/${projectId}/screenshots`, {
        environment: environment
    });
}

// Get last snapshot. Compare this snapshot with the new one after deploy
const getLastSnapshot = async (projectId) => {
    return await sendRequest('POST', `/projects/${projectId}/last-screenshot`);
}

const createDiff = async (projectId, snapshot1, snapshot2) => {
    const response = await sendRequest('POST', `/projects/${projectId}/diffs`, {
        snapshot1: snapshot1,
        snapshot2: snapshot2
    });

    console.log('API Response:', response);
}

const fetchUrls = async (url) => {
    try {
        return await sendRequest('POST', '/scan', {
            password: '',
            projectId: null,
            url: url,
            user: '',
        })
    } catch (error) {
        console.error('Error posting data:', error.message);
    }
}

const deploy = async (projectId) => {
    try {
        let lastScreenshot = await getLastSnapshot(projectId)

        new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });

        let snapshot1New = await createSnapshot(projectId);

        await createDiff(projectId, lastScreenshot, snapshot1New);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function main() {
    await authenticate();
    let projectId = await createProject('bbc.com');
    let snapshot1 = await createSnapshot(projectId);
    let snapshot2 = await createSnapshot(projectId);
    await createDiff(projectId, snapshot1, snapshot2);
}

main();
