const { sendRequest, authenticate } = require('./services/api');

const urlArg = process.argv.find(arg => arg.startsWith('--url='));
let url = urlArg.split('=')[1];
url = url.replace(/^['"]|['"]$/g, '');

const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
const WEBHOOK_API = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests`;
const WEBHOOK_URL = `https://webhook.site/${WEBHOOK_TOKEN}`;

/**
 * Creates a project using the provided YAML configuration.
 * @param {string} url - Base URL for scanning.
 * @returns {Promise<number>} The project ID.
 */
const createProject = async (url) => {
    try {
        const scannedUrls = await fetchUrls(url);

        const projectData = {
            baseUrl: url,
            name: url,
            scanUrl: url,
            urls: scannedUrls.urls,
            notify: {
                psNotifyWebhookUrl: WEBHOOK_URL || null
            }
        };

        return await sendRequest('POST', '/projects', projectData);
    } catch (error) {
        throw new Error('Failed to create project.');
    }
};

/**
 * Creates a snapshot for a given project.
 * @param {number} projectId - The project ID.
 * @param {string} [environment='production'] - The environment.
 * @returns {Promise<number>} The snapshot ID.
 */
const createSnapshot = async (projectId, environment = 'production') => {
    try {
        return await sendRequest('POST', `/projects/${projectId}/screenshots`, { environment });
    } catch (error) {
        throw new Error('Failed to create snapshot.');
    }
};

/**
 * Creates a diff between two snapshots.
 * @param {number} projectId - The project ID.
 * @param {number} snapshot1 - The first snapshot ID.
 * @param {number} snapshot2 - The second snapshot ID.
 * @returns {Promise<void>}
 */
const createDiff = async (projectId, snapshot1, snapshot2) => {
    try {
        await sendRequest('POST', `/projects/${projectId}/diffs`, { snapshot1, snapshot2 });
    } catch (error) {
        throw new Error('Failed to create diff.');
    }
};

/**
 * Fetches URLs for scanning.
 * @param {string} url - The URL to scan.
 * @returns {Promise<object>} Scanned URLs.
 */
const fetchUrls = async (url) => {
    try {
        return await sendRequest('POST', '/scan', {
            password: '',
            projectId: null,
            url,
            user: ''
        });
    } catch (error) {
        throw new Error('Failed to fetch URLs.');
    }
};

/**
 * Fetches webhook data and filters the latest valid screenshot for deployment.
 * @param {number} projectId - The project ID.
 * @returns {Promise<void>}
 */
const deploy = async (projectId) => {
    try {
        let lastScreenshot = await getLastScreenshot(projectId)

        // Simulate deployment delay
        await new Promise((resolve) => setTimeout(resolve, 5000));

        const freshSnapshotId = await createSnapshot(projectId);

        await createDiff(projectId, lastScreenshot.id, freshSnapshotId);

        console.log(`Deployment completed for project ${projectId}`);
    } catch (error) {
        console.error('Deployment error:', error.message);
    }
};

const getLastScreenshot = async (projectId) => {
    const webhookData = await fetchWebhookData();

    if (!webhookData || webhookData.length === 0) {
        console.error('No webhook data found.');
        return;
    }

    // Filter and sort by created date (newest first)
    const lastScreenshot = webhookData
        .filter(obj => obj.project_id === projectId && obj.type === 'snapshot')
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    if (lastScreenshot.length === 0) {
        console.error('No valid screenshots found for deployment.');
        return;
    }

    return lastScreenshot[0];
}

/**
 * Fetches webhook data and filters the latest valid diff for review.
 * @param {number} projectId - The project ID.
 * @returns {Promise<void>}
 */
const getLastDiff = async (projectId) => {
    const webhookData = await fetchWebhookData();

    if (!webhookData || webhookData.length === 0) {
        console.error('No webhook data found.');
        return;
    }

    // Filter and sort by created date (newest first)
    const filtereDiffs = webhookData
        .filter(obj => obj.project_id === projectId && obj.type === 'diff')
        .sort((a, b) => new Date(b.created) - new Date(a.created));

    if (filtereDiffs.length === 0) {
        console.error('No valid screenshots found for deployment.');
        return;
    }

    return filtereDiffs[0]
}

/**
 * Fetches data from the webhook.
 * @returns {Promise<object[]>} Parsed webhook data.
 */
const fetchWebhookData = async () => {
    try {
        const response = await fetch(WEBHOOK_API, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch webhook data, Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.data) {
            return [];
        }

        return data.data
            .filter(item => item.content && typeof item.content === 'string') // Ensure content is valid
            .map(item => {
                try {
                    return JSON.parse(item.content);
                } catch (error) {
                    return null;
                }
            })
            .filter(parsedItem => parsedItem !== null);

    } catch (error) {
        throw new Error('Failed to fetch webhook data.');
    }
};

async function main() {
    await authenticate();
    let projectId = await createProject(url);
    console.log(projectId)
}

main();
