const axios = require('axios');
const { exec } = require('child_process');
const crypto = require('crypto');

// AllAnime API configuration
const API_URL = 'https://api.allanime.day/api';
const BASE_URL = 'allanime.day';
const REFERER = 'https://allmanga.to/';
const ORIGIN = 'https://youtu-chan.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0';
const EPISODE_QUERY_HASH = 'd405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec';

const HEADERS = {
    'Accept': 'application/json',
    'User-Agent': USER_AGENT,
    'Referer': REFERER
};

// Decode map for AllAnime URL encoding
const DECODE_MAP = {
    '79': 'A', '7a': 'B', '7b': 'C', '7c': 'D', '7d': 'E', '7e': 'F', '7f': 'G',
    '70': 'H', '71': 'I', '72': 'J', '73': 'K', '74': 'L', '75': 'M', '76': 'N',
    '77': 'O', '68': 'P', '69': 'Q', '6a': 'R', '6b': 'S', '6c': 'T', '6d': 'U',
    '6e': 'V', '6f': 'W', '60': 'X', '61': 'Y', '62': 'Z', '59': 'a', '5a': 'b',
    '5b': 'c', '5c': 'd', '5d': 'e', '5e': 'f', '5f': 'g', '50': 'h', '51': 'i',
    '52': 'j', '53': 'k', '54': 'l', '55': 'm', '56': 'n', '57': 'o', '48': 'p',
    '49': 'q', '4a': 'r', '4b': 's', '4c': 't', '4d': 'u', '4e': 'v', '4f': 'w',
    '40': 'x', '41': 'y', '42': 'z', '08': '0', '09': '1', '0a': '2', '0b': '3',
    '0c': '4', '0d': '5', '0e': '6', '0f': '7', '00': '8', '01': '9', '15': '-',
    '16': '.', '67': '_', '46': '~', '02': ':', '17': '/', '07': '?', '1b': '#',
    '63': '[', '65': ']', '78': '@', '19': '!', '1c': '$', '1e': '&', '10': '(',
    '11': ')', '12': '*', '13': '+', '14': ',', '03': ';', '05': '=', '1d': '%'
};

/**
 * Decode AllAnime provider ID
 */
function decodeProviderId(encoded) {
    let result = '';
    let i = 0;
    while (i < encoded.length) {
        const pair = encoded.substring(i, i + 2);
        if (DECODE_MAP[pair]) {
            result += DECODE_MAP[pair];
        }
        i += 2;
    }
    return result.replace('/clock', '/clock.json');
}

/**
 * Check if response contains CAPTCHA
 */
function isCaptchaResponse(resp) {
    return resp && (resp.includes('NEED_CAPTCHA') || resp.includes('Just a moment') || resp.includes('cf-chl'));
}

/**
 * Execute curl POST request
 */
function curlPostApi(payload, label) {
    return new Promise((resolve, reject) => {
        const apiUrl = `${API_URL}`;
        const cmd = `curl -e "${REFERER}" -s -H "Content-Type: application/json" -X POST "${apiUrl}" --data '${payload}' -A "${USER_AGENT}"`;
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`curl request failed: ${error.message}`));
                return;
            }
            resolve(stdout);
        });
    });
}

/**
 * Execute curl GET request
 */
function curlGet(url, label, origin) {
    return new Promise((resolve, reject) => {
        let cmd = `curl -e "${REFERER}" -s -A "${USER_AGENT}"`;
        if (origin) {
            cmd += ` -H "Origin: ${origin}"`;
        }
        cmd += ` "${url}"`;
        
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`curl request failed: ${error.message}`));
                return;
            }
            resolve(stdout);
        });
    });
}

/**
 * Make GraphQL request to AllAnime API
 */
async function graphqlRequest(query, variables, label = null) {
    const payload = JSON.stringify({
        variables: variables,
        query: query
    });

    try {
        const response = await axios.post(API_URL, payload, {
            headers: { ...HEADERS, 'Content-Type': 'application/json' },
            timeout: 15000
        });
        
        const respText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        
        if (isCaptchaResponse(respText)) {
            console.log(`CAPTCHA detected, using curl fallback for ${label || 'request'}`);
            const curlResp = await curlPostApi(payload, label);
            return JSON.parse(curlResp);
        }
        
        return response.data;
    } catch (error) {
        // Fallback to curl
        console.log(`Request failed, using curl fallback for ${label || 'request'}`);
        try {
            const curlResp = await curlPostApi(payload, label);
            return JSON.parse(curlResp);
        } catch (curlError) {
            console.error('Both axios and curl failed:', curlError.message);
            return null;
        }
    }
}

/**
 * Search for anime
 */
async function search(query, mode = 'sub') {
    const q = query.trim();
    if (!q) return [];

    const gql = `query($search: SearchInput $limit: Int $page: Int $translationType: VaildTranslationTypeEnumType $countryOrigin: VaildCountryOriginEnumType) {
        shows(search: $search limit: $limit page: $page translationType: $translationType countryOrigin: $countryOrigin) {
            edges {
                _id
                name
                availableEpisodes
                __typename
            }
        }
    }`;

    const variables = {
        search: {
            allowAdult: false,
            allowUnknown: false,
            query: q
        },
        limit: 40,
        page: 1,
        translationType: mode,
        countryOrigin: 'ALL'
    };

    const data = await graphqlRequest(gql, variables);
    if (!data || !data.data) return [];

    const shows = data.data.shows?.edges || [];
    const results = [];

    for (const show of shows) {
        const animeId = show._id;
        const name = show.name;
        const episodes = show.availableEpisodes || {};

        if (!animeId || !name) continue;

        const epCount = episodes[mode] || 0;
        if (epCount === 0) continue;

        results.push({
            id: animeId,
            title: name,
            type: 'series'
        });
    }

    return results;
}

/**
 * Get anime details
 */
async function getDetails(animeId, mode = 'sub') {
    const gql = `query ($showId: String!) {
        show(_id: $showId) {
            _id
            name
            description
            thumbnail
            availableEpisodesDetail
        }
    }`;

    const variables = { showId: animeId };
    const data = await graphqlRequest(gql, variables);

    if (!data || !data.data) return null;

    const show = data.data.show;
    if (!show) return null;

    const title = show.name || animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const description = show.description;
    const thumbnail = show.thumbnail;

    const epDetail = show.availableEpisodesDetail || {};
    const epList = epDetail[mode] || [];

    const episodes = [];
    const sortedEpList = epList.sort((a, b) => {
        const aNum = parseFloat(a.replace('.', ''));
        const bNum = parseFloat(b.replace('.', ''));
        return aNum - bNum;
    });

    for (let i = 0; i < sortedEpList.length; i++) {
        episodes.push({
            id: `${animeId}::ep=${sortedEpList[i]}`,
            number: i + 1,
            title: `Episode ${sortedEpList[i]}`
        });
    }

    return {
        id: animeId,
        title: title,
        description: description,
        cover: thumbnail,
        episodes: episodes,
        total_episodes: episodes.length
    };
}

/**
 * Get episodes for an anime
 */
async function getEpisodes(animeId, mode = 'sub') {
    const gql = `query ($showId: String!) {
        show(_id: $showId) {
            _id
            availableEpisodesDetail
        }
    }`;

    const variables = { showId: animeId };
    const data = await graphqlRequest(gql, variables);

    if (!data || !data.data) return [];

    const show = data.data.show;
    const epDetail = show.availableEpisodesDetail || {};
    const epList = epDetail[mode] || [];

    const episodes = [];
    const sortedEpList = epList.sort((a, b) => {
        const aNum = parseFloat(a.replace('.', ''));
        const bNum = parseFloat(b.replace('.', ''));
        return aNum - bNum;
    });

    for (let i = 0; i < sortedEpList.length; i++) {
        episodes.push({
            id: `${animeId}::ep=${sortedEpList[i]}`,
            number: i + 1,
            title: `Episode ${sortedEpList[i]}`
        });
    }

    return episodes;
}

/**
 * Get AllAnime key for decryption
 */
function getAllAnimeKey() {
    return crypto.createHash('sha256').update('Xot36i3lK3:v1').digest();
}

/**
 * AES-256-CTR decryption
 */
function aes256CtrDecrypt(key, ctr, ciphertext) {
    const cipher = crypto.createDecipheriv('aes-256-ctr', key, ctr);
    let decrypted = cipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, cipher.final()]);
    return decrypted;
}

/**
 * Decode tobeparsed field
 */
function decodeToBeParsed(blob) {
    try {
        const data = Buffer.from(blob, 'base64');
        if (data.length < 13 + 16) {
            return [];
        }

        const key = getAllAnimeKey();
        const iv = data.slice(1, 13);
        const ctr = Buffer.alloc(16);
        iv.copy(ctr, 0, 0, 12);
        ctr[15] = 2;

        const ctLen = data.length - 13 - 16;
        const ct = data.slice(13, 13 + ctLen);

        const plainBytes = aes256CtrDecrypt(key, ctr, ct);
        const plain = plainBytes.toString('utf-8');

        const results = [];
        const parts = plain.split('}');
        for (const part of parts) {
            if (part.includes('"sourceUrl":"--')) {
                const urlMatch = part.split('"sourceUrl":"--')[1]?.split('"')[0];
                const nameMatch = part.split('"sourceName":"')[1]?.split('"')[0];
                if (urlMatch) {
                    results.push({
                        sourceName: nameMatch || 'unknown',
                        sourceUrl: '--' + urlMatch
                    });
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Failed to decode tobeparsed:', error.message);
        return [];
    }
}

/**
 * Extract source pairs from raw response
 */
function extractSourcePairsFromRaw(raw) {
    const results = [];
    let cursor = raw;
    
    while (true) {
        const urlPos = cursor.indexOf('"sourceUrl":"--');
        if (urlPos === -1) break;
        
        const afterUrl = cursor.substring(urlPos + '"sourceUrl":"--'.length);
        const urlEnd = afterUrl.indexOf('"');
        if (urlEnd === -1) break;
        
        const encoded = afterUrl.substring(0, urlEnd);
        const afterUrl2 = afterUrl.substring(urlEnd);
        
        const namePos = afterUrl2.indexOf('"sourceName":"');
        if (namePos === -1) {
            cursor = afterUrl2.substring(1);
            continue;
        }
        
        const afterName = afterUrl2.substring(namePos + '"sourceName":"'.length);
        const nameEnd = afterName.indexOf('"');
        if (nameEnd === -1) break;
        
        const name = afterName.substring(0, nameEnd);
        
        if (encoded) {
            results.push({
                sourceName: name,
                sourceUrl: '--' + encoded
            });
        }
        
        cursor = afterName.substring(nameEnd);
    }
    
    return results;
}

/**
 * Get stream URLs for an episode
 */
async function getStreams(animeId, episodeId, mode = 'sub') {
    let showId, epNo;

    if (episodeId.includes('::ep=')) {
        const parts = episodeId.split('::ep=');
        showId = parts[0];
        epNo = parts[1];
    } else {
        showId = animeId;
        epNo = episodeId;
    }

    const gql = `query ($showId: String!, $translationType: VaildTranslationTypeEnumType!, $episodeString: String!) {
        episode(showId: $showId translationType: $translationType episodeString: $episodeString) {
            episodeString
            sourceUrls
        }
    }`;

    const variables = {
        showId: showId,
        translationType: mode,
        episodeString: epNo
    };

    const queryExt = JSON.stringify({
        persistedQuery: {
            version: 1,
            sha256Hash: EPISODE_QUERY_HASH
        }
    });

    // Try persisted query first (ani-cli approach)
    let apiUrl = `${API_URL}?variables=${encodeURIComponent(JSON.stringify(variables))}&extensions=${encodeURIComponent(queryExt)}`;
    let resp = '';

    try {
        const response = await axios.get(apiUrl, {
            headers: { ...HEADERS, 'Origin': ORIGIN },
            timeout: 15000
        });
        resp = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (error) {
        console.log('Persisted query failed, trying fallback');
    }

    // If CAPTCHA or empty, try curl
    if (isCaptchaResponse(resp) || !resp || !resp.includes('tobeparsed')) {
        try {
            resp = await curlGet(apiUrl, 'episode-persisted', ORIGIN);
        } catch (error) {
            console.log('Curl persisted failed, trying POST fallback');
        }
    }

    // If still no data, try POST
    if (!resp || !resp.includes('tobeparsed')) {
        const payload = JSON.stringify({ variables, query: gql });
        try {
            const response = await axios.post(API_URL, payload, {
                headers: { ...HEADERS, 'Content-Type': 'application/json' },
                timeout: 15000
            });
            resp = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        } catch (error) {
            console.log('POST failed, trying curl POST');
        }

        if (isCaptchaResponse(resp)) {
            try {
                resp = await curlPostApi(payload, 'episode');
            } catch (error) {
                console.error('All methods failed:', error.message);
                return [];
            }
        }
    }

    // Parse response
    let providerData = [];

    // Try to extract tobeparsed
    const toBeParsedMatch = resp.match(/"tobeparsed":"([^"]+)"/);
    if (toBeParsedMatch) {
        providerData = decodeToBeParsed(toBeParsedMatch[1]);
    } else {
        // Try JSON parsing
        try {
            const json = JSON.parse(resp);
            if (json.data?.episode?.tobeparsed) {
                providerData = decodeToBeParsed(json.data.episode.tobeparsed);
            } else if (json.data?.episode?.sourceUrls) {
                providerData = json.data.episode.sourceUrls;
            }
        } catch (error) {
            // Extract from raw
            providerData = extractSourcePairsFromRaw(resp);
        }
    }

    if (providerData.length === 0) {
        providerData = extractSourcePairsFromRaw(resp);
    }

    if (providerData.length === 0) {
        console.log('No provider data found');
        return [];
    }

    const streams = [];

    for (const source of providerData) {
        try {
            let sourceUrl = source.sourceUrl || '';
            const sourceName = source.sourceName || 'unknown';

            if (!sourceUrl || !sourceUrl.startsWith('--')) continue;

            const encoded = sourceUrl.substring(2);
            const decodedPath = decodeProviderId(encoded);

            if (!decodedPath) continue;

            const fullUrl = decodedPath.startsWith('https://') ? decodedPath : `https://${BASE_URL}${decodedPath}`;

            // Skip if it's a direct playable URL
            if (fullUrl.includes('.mp4') || fullUrl.includes('.m3u8') || fullUrl.includes('tools.fast4speed.rsvp')) {
                streams.push({
                    url: fullUrl,
                    quality: 'auto',
                    server: sourceName.toLowerCase(),
                    headers: { Referer: REFERER }
                });
                continue;
            }

            const streamData = await axios.get(fullUrl, { headers: HEADERS, timeout: 15000 });
            if (!streamData.data) continue;

            const links = streamData.data.links || [];
            for (const link of links) {
                const linkUrl = link.link;
                const resolution = link.resolutionStr || 'auto';

                if (linkUrl) {
                    streams.push({
                        url: linkUrl,
                        quality: resolution,
                        server: sourceName.toLowerCase(),
                        headers: { Referer: REFERER }
                    });
                }
            }
        } catch (error) {
            continue;
        }
    }

    // Sort by quality
    streams.sort((a, b) => {
        const aNum = parseInt(a.quality.replace('p', '')) || 0;
        const bNum = parseInt(b.quality.replace('p', '')) || 0;
        return bNum - aNum;
    });

    return streams;
}

module.exports = {
    search,
    getDetails,
    getEpisodes,
    getStreams
};
