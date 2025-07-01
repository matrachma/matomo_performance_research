import http from 'k6/http';
import { sleep } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

// --- Options remain the same ---
export const options = {
    tags: { name: 'PostsTrackURL_Realistic' },
    discardResponseBodies: true,
    throw: false,
    stages: [
        { duration: '1m', target: 5000 },
        { duration: '1m', target: 5000 },
        { duration: '1m', target: 0 },
    ],
};

// --- Helper function for random hex ---
const getRanHex = (size) => {
    let result = [];
    let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    for (let n = 0; n < size; n++) {
        result.push(hexRef[Math.floor(Math.random() * 16)]);
    }
    return result.join('');
};

// --- NEW: setup() function to generate visitor IDs ONCE ---
// This runs before the test starts. We create one unique visitor ID for each potential Virtual User.
export function setup() {
    const visitorIds = [];
    // Generate enough IDs for the maximum possible number of VUs in your test
    for (let i = 0; i < 5000; i++) {
        visitorIds.push(getRanHex(16));
    }
    return { vus: visitorIds };
}

// --- MODIFIED: main default function ---
export default function(data) {
    // Each Virtual User (VU) picks one ID from the setup data and uses it for all its requests.
    // The __VU variable is a unique number (1, 2, 3...) for each active virtual user.
    // We subtract 1 because arrays are 0-indexed.
    const visitorId = data.vus[__VU - 1];

    const url = new URL('http://matomo-tracker/matomo.php');
    url.searchParams.append('action_name', 'Halaman Testing');
    url.searchParams.append('idsite', '1');
    url.searchParams.append('rec', '1');
    url.searchParams.append('r', '988103');
    url.searchParams.append('h', '10');
    url.searchParams.append('m', '7');
    url.searchParams.append('s', '25');
    // MODIFIED: Use the same visitorId for every request this VU makes
    url.searchParams.append('_id', visitorId);
    url.searchParams.append('_idn', '0');
    url.searchParams.append('send_image', '0');
    url.searchParams.append('_refts', '0');
    // MODIFIED: Generate a random page view ID for each hit
    url.searchParams.append('pv_id', getRanHex(6));
    url.searchParams.append('pf_net', '0');
    url.searchParams.append('pf_srv', '3');
    url.searchParams.append('pf_tfr', '2');
    url.searchParams.append('pf_dm1', '13');
    url.searchParams.append('uadata', "{\"fullVersionList\":[{\"brand\":\"Not/A)Brand\",\"version\":\"8.0.0.0\"},{\"brand\":\"Chromium\",\"version\":\"126.0.0.0\"},{\"brand\":\"Brave\",\"version\":\"126.0.0.0\"}],\"mobile\":false,\"model\":\"\",\"platform\":\"Linux\",\"platformVersion\":\"6.1.0\"}");
    url.searchParams.append('pdf', '1');
    url.searchParams.append('qt', '0');
    url.searchParams.append('realp', '0');
    url.searchParams.append('wma', '0');
    url.searchParams.append('fla', '0');
    url.searchParams.append('java', '0');
    url.searchParams.append('ag', '0');
    url.searchParams.append('cookie', '1');
    url.searchParams.append('res', '1920x1080');

    http.post(
        url.toString(),
        {},
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                'User-Agent': randomItem([
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0"
                ]),
            },
        }
    );

    sleep(1);
};