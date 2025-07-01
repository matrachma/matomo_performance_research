import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const successfulTrackingRequests = new Counter('successful_tracking_requests');
const failedTrackingRequests = new Counter('failed_tracking_requests');
const trackingRequestErrorRate = new Rate('tracking_request_error_rate');
const sessionDepth = new Trend('session_depth_page_views'); // Track how many page views per user session

export const options = {
    // Very aggressive stages to hit massive PV targets.
    // This profile aims for a sustained high load with significant spikes.
    // Adjust totalDuration as needed (e.g., '1h', '4h').
    // The target VUs are calibrated for very high RPS with minimal sleep.
    stages: [
        { duration: '5m', target: 200 },  // Ramp-up to a high baseline (moderate load)
        { duration: '30m', target: 500 }, // Sustain high load for typical peak hours
        { duration: '10m', target: 1500 },// Simulate a major news/event spike (very high load)
        { duration: '30m', target: 500 }, // Return to sustained high load
        { duration: '5m', target: 0 },    // Ramp-down
    ],
    // The `duration` of the entire test should be long enough to get meaningful data.
    // For 500M+ PV/month, you might consider running this for several hours (e.g., '4h')
    // and scaling up the VUs if your load generators can handle it.
    // Total duration for the above stages is 1h 20m. You might repeat this block or extend it.
    // If you need to simulate a full day, you'd define 24 hourly stages.

    thresholds: {
        'http_req_duration': ['p(95)<350', 'p(99)<600'], // Matomo tracking should be fast
        'http_req_failed': ['rate<0.003'],             // Extremely low HTTP error rate expected
        'successful_tracking_requests': ['count>100000'], // Expect millions of requests over the test
        'tracking_request_error_rate': ['rate<0.01'],   // Very low tracking-specific error rate
        'session_depth_page_views': ['avg>=4.5'],       // Ensure average page views per session meets target
    },
    discardResponseBodies: true,
    // Adjust this to your k6 Cloud project ID if using k6 Cloud
    ext: {
        loadimpact: {
            projectID: 3687352,
            name: "Matomo High-Volume Traffic Mimic (PV/UV)",
        },
    },
};

// --- Helper Functions ---
function getRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRandomCategory() {
    const categories = ['News', 'Sports', 'Entertainment', 'Technology', 'Politics', 'Business', 'Lifestyle', 'Travel', 'Health', 'Science'];
    return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomAuthor() {
    const authors = ['A. Writer', 'B. Journalist', 'C. Editor', 'D. Contributor', 'E. Reporter'];
    return authors[Math.floor(Math.random() * authors.length)];
}

// Global variable to maintain a "session" for a VU
let sessionPageViewCount = 0;
let currentUserId = '';
let currentVisitorId = '';

export function setup() {
    // This runs once before the VUs start. You could pre-generate data here.
}

// --- Main Test Logic ---
export default function () {
    const matomoUrl = 'http://matomo-tracker/matomo.php'; // e.g., 'https://stats.your-massive-site.com/matomo.php'
    const siteId = '1';     // Your Matomo site ID
    const authToken = ''; // Optional: Your Matomo auth token

    // Initialize user and visitor IDs for a new session or continue existing
    // Logic to simulate a user session:
    // A user generates 4-5 page views on average.
    // We'll reset the user/visitor ID and session count after N page views (e.g., 5-7).
    if (currentUserId === '' || sessionPageViewCount >= (Math.floor(Math.random() * 3) + 4)) { // 4 to 6 PV per session
        currentUserId = `user_${getRandomString(12)}`;
        currentVisitorId = getRandomString(16);
        sessionPageViewCount = 0;
    }

    // Base parameters for all requests
    let baseParams = {
        'idsite': siteId,
        'rec': 1,
        'rand': Math.floor(Math.random() * 100000000000), // Cache buster
        'apiv': 1, // API Version
        '_id': currentVisitorId, // Visitor ID
        'cid': getRandomString(10), // Client ID
        'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 K6MegaTrafficTester',
        'lang': 'en-US',
        'res': '1920x1080',
        'cookie': 1,
        'gt_ms': Math.floor(Math.random() * 1000), // Page generation time (faster for high traffic sites)
    };

    if (authToken) {
        baseParams.token_auth = authToken;
    }

    // User ID for tracking logged-in users (e.g., 5-10% of traffic)
    if (Math.random() < 0.07) {
        baseParams.uid = currentUserId;
    }

    // --- Action Probabilities (Highly skewed towards page views) ---
    const actionProbability = Math.random();
    let tags = { type: 'matomo_tracking_request' }; // Default tag

    if (actionProbability < 0.95) { // 95% chance of a page view
        let pageTypeProbability = Math.random();
        let pageUrl, actionName, category, author;

        if (pageTypeProbability < 0.7) {
            // Article Page View (most common)
            category = getRandomCategory();
            author = getRandomAuthor();
            pageUrl = `https://connect.detik.com/${category.toLowerCase()}/${getRandomString(12)}-article-${getRandomString(7)}.html`;
            actionName = `Article: ${category} - ${getRandomString(9)}`;
            // Custom dimensions (adjust to your Matomo configuration)
            baseParams.dimension1 = category;
            baseParams.dimension2 = author;
            tags = { type: 'matomo_page_view_article' };
        } else if (pageTypeProbability < 0.9) {
            // Category Page / Section Page
            category = getRandomCategory();
            pageUrl = `https://connect.detik.com/category/${category.toLowerCase()}/`;
            actionName = `Category: ${category}`;
            tags = { type: 'matomo_page_view_category' };
        } else {
            // Homepage or Search Results
            const searchTerm = getRandomString(8);
            pageUrl = `https://connect.detik.com/search?q=${searchTerm}`;
            actionName = `Search Results for "${searchTerm}"`;
            tags = { type: 'matomo_page_view_search' };
        }

        const params = {
            ...baseParams,
            'url': pageUrl,
            'action_name': actionName,
        };
        sendTrackingRequest(matomoUrl, params, tags);
        sessionPageViewCount++; // Increment PV for current session

    } else { // 5% chance of an event (content interaction, engagement)
        const eventType = Math.random();
        let params = { ...baseParams };
        let eventCategory, eventAction, eventName;

        if (eventType < 0.4) {
            // Scroll Depth Event (e.g., 50% or 100%)
            const scrollDepth = Math.random() < 0.5 ? 50 : 100;
            eventCategory = 'Content Engagement';
            eventAction = 'Scroll Depth';
            eventName = `${scrollDepth}% Scrolled`;
            tags = { type: 'matomo_event_scroll' };
        } else if (eventType < 0.7) {
            // Video Play Event (more plays, some completes)
            const videoId = `VID-${getRandomString(7)}`;
            const videoAction = Math.random() < 0.7 ? 'Play' : 'Complete';
            eventCategory = 'Video';
            eventAction = videoAction;
            eventName = `Video: ${videoId}`;
            tags = { type: 'matomo_event_video' };
        } else if (eventType < 0.9) {
            // Ad Impression/Click (if you track impressions separately) or other UI interaction
            const adId = `AD-${getRandomString(5)}`;
            eventCategory = 'Advertising';
            eventAction = Math.random() < 0.9 ? 'Ad Impression' : 'Ad Click';
            eventName = `Ad: ${adId}`;
            tags = { type: 'matomo_event_ad_interaction' };
        } else {
            // Social Share / Newsletter Signup / Comment
            const interactionType = Math.random();
            if (interactionType < 0.4) {
                eventCategory = 'Social Sharing';
                eventAction = 'Share Click';
                eventName = `Shared on ${Math.random() < 0.5 ? 'X' : 'Facebook'}`;
                tags = { type: 'matomo_event_social_share' };
            } else if (interactionType < 0.8) {
                eventCategory = 'Engagement';
                eventAction = 'Newsletter Signup';
                eventName = 'Successful Signup';
                tags = { type: 'matomo_event_newsletter_signup' };
                // Optionally trigger a Matomo Goal for this significant conversion
                params.idgoal = 1; // Assuming Goal ID 1 is for Newsletter Signup
            } else {
                eventCategory = 'Engagement';
                eventAction = 'Comment Posted';
                eventName = `Article: ${getRandomString(8)}`;
                tags = { type: 'matomo_event_comment_post' };
            }
        }

        params.e_c = eventCategory;
        params.e_a = eventAction;
        params.e_n = eventName;

        sendTrackingRequest(matomoUrl, params, tags);
    }

    // Very aggressive sleep time to generate high RPS.
    // This averages around 0.075 seconds sleep.
    // 1 / 0.075 = ~13.3 requests per second per VU.
    // 500 VUs * 13.3 RPS/VU = ~6650 RPS (sustained)
    // 1500 VUs * 13.3 RPS/VU = ~20000 RPS (spike)
    sleep(Math.random() * 0.1 + 0.05);
}

// --- Helper for sending tracking request and checking response ---
function sendTrackingRequest(url, params, tags) {
    const res = http.get(url, {
        qs: params,
        tags: tags,
    });

    const checkResult = check(res, {
        'is status 200': (r) => r.status === 200,
        'response body contains "Matomo Analytics" or similar': (r) => r.body.includes('Matomo Analytics') || r.body.includes('Piwik Analytics'),
    });

    if (checkResult) {
        successfulTrackingRequests.add(1);
    } else {
        failedTrackingRequests.add(1);
    }
    trackingRequestErrorRate.add(!checkResult);
}