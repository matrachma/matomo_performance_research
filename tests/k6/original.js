import http from 'k6/http';
import { sleep } from 'k6';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
    // Key configurations for Stress in this section
    tags: { name: 'PostsTrackURL' },
    discardResponseBodies: true,
    throw: false,
    stages: [
        { duration: '1m', target: 500 }, // traffic ramp-up from 1 to a higher 1000 users over 1 minutes.
        { duration: '1m', target: 500 }, // stay at higher 1000 users for 1 minutes
        { duration: '1m', target: 0 }, // ramp-down to 0 users
    ],
};

export default function() {
    const getRanHex = (size) => {
        let result = [];
        let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

        for (let n = 0; n < size; n++) {
            result.push(hexRef[Math.floor(Math.random() * 16)]);
        }
        return result.join('');
    };
    const id = getRanHex(16);
    const url = new URL('http://matomo-tracker/matomo.php');
    url.searchParams.append('action_name', 'Halaman Testing');
    url.searchParams.append('idsite', '1');
    url.searchParams.append('rec', '1');
    url.searchParams.append('r', '988103');
    url.searchParams.append('h', '10');
    url.searchParams.append('m', '7');
    url.searchParams.append('s', '25');
    url.searchParams.append('_id', getRanHex(16));
    url.searchParams.append('_idn', '0');
    url.searchParams.append('send_image', '0');
    url.searchParams.append('_refts', '0');
    url.searchParams.append('pv_id', 'meF2GH');
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

    try {
        const urlRes = http.post(
            url.toString(),
            {},
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    // 'Accept': '*/*',
                    // 'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': randomItem([
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
                        "Mozilla/5.0 (X11; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0",
                        "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
                    ]),
                },
            }
        );
    } catch (e) {

    }
    sleep(1);
    // MORE STEPS
    // Here you can have more steps or complex script
    // Step1
    // Step2
    // etc.
};