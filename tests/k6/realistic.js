import http from 'k6/http';
import { sleep } from 'k6';

// ######################################################################
// ##
// ##  CONFIGURATION
// ##  - Adjust these values to match your Matomo setup and test goals
// ##
// ######################################################################

// The base URL of your Matomo server's tracker endpoint
const MATOMO_URL = 'http://matomo-web/matomo.php';

// The Site ID you want to send traffic to
const IDSITE = '1';

// A list of realistic User-Agent strings to avoid bot detection.
// This simulates a mix of desktop and mobile users.
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
];

// A list of example article URLs to make the test data look realistic.
// Add more URLs from your site to improve the simulation.
const articleUrls = [
    '/sports/championship-recap-2025',
    '/politics/election-preview-main-story',
    '/business/market-trends-and-analysis',
    '/technology/new-gadget-review-latest-model',
    '/lifestyle/healthy-living-tips-for-summer',
    '/entertainment/blockbuster-movie-review',
    '/world/global-summit-key-takeaways',
    '/science/new-discovery-in-particle-physics',
];


// ######################################################################
// ##
// ##  LOAD TEST SCENARIO
// ##  - This defines the shape of the traffic over time.
// ##
// ######################################################################

export const options = {
    scenarios: {
        // A single scenario named 'realistic_traffic'
        realistic_traffic: {
            executor: 'ramping-vus', // Ramps the number of Virtual Users up and down
            startVUs: 0,             // Start with 0 users
            stages: [
                // Ramp up to 200 virtual users over 2 minutes
                { duration: '2m', target: 200 },
                // Stay at 200 virtual users for 5 minutes to measure a sustained load
                { duration: '5m', target: 200 },
                // Ramp down to 0 users over 1 minute
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s', // Allow time for VUs to finish their sessions
        },
    },
};


// ######################################################################
// ##
// ##  VIRTUAL USER (VU) SCRIPT
// ## - This is the code that each virtual user will execute.
// ## - It simulates one complete user session.
// ##
// ######################################################################

export default function () {
    // --- 1. ESTABLISH USER IDENTITY & BROWSER ---
    // Create a persistent visitor ID for this Virtual User.
    // `__VU` is a unique number for each VU, so this ID remains the
    // same for all sessions run by this specific VU.
    const visitorId = `user${__VU}`;

    // Select a random User-Agent for this user's entire session.
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // --- 2. SIMULATE SESSION BEHAVIOR ---
    // Based on your data (PV/UV ratio), a user views ~4.6 pages.
    // We'll simulate this by having each user view a random number of pages between 3 and 6.
    const pagesToView = Math.floor(Math.random() * 4) + 3; // Random integer between 3 and 6

    for (let i = 0; i < pagesToView; i++) {
        // --- 3. PREPARE THE TRACKING REQUEST ---
        const randomUrlPath = articleUrls[Math.floor(Math.random() * articleUrls.length)];
        const fullUrl = `https://connect.detik.com${randomUrlPath}`;
        const pageTitle = randomUrlPath.substring(1).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        const data = {
            idsite: IDSITE,
            rec: 1,
            apiv: 1,
            _id: visitorId, // Use the SAME visitorId for all requests in this session
            url: fullUrl,
            action_name: pageTitle,
            cdt: Math.floor(Date.now() / 1000), // Current timestamp
            ua: userAgent, // Use the randomly selected, realistic User-Agent
            lang: 'en-us',
        };

        // --- 4. SEND THE REQUEST ---
        http.post(
            MATOMO_URL,
            data,
            {
                tags: { name: 'MatomoTracker' },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    // 'Accept': '*/*',
                    // 'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': userAgent,
                },
            }
        );

        // --- 5. SIMULATE USER "THINK TIME" ---
        // Wait for a random time between 5 and 15 seconds before the "next page view".
        // This is critical for creating a realistic traffic pattern.
        sleep(Math.random() * 10 + 5);
    }

    // --- 6. END OF SESSION ---
    // The user has finished their visit. We add a longer sleep to simulate
    // the time before this same user starts a completely new session.
    sleep(Math.random() * 30 + 30); // Wait 30-60 seconds before the next session
}