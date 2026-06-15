const axios = require('axios');

// Weeb API configuration
const BASE_URL = 'https://anime-api.ewgsta.workers.dev';

const HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

/**
 * Make HTTP request
 */
async function request(url, params = {}) {
    try {
        const response = await axios.get(url, {
            headers: HEADERS,
            params: params,
            timeout: 15000
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

/**
 * Search for anime
 */
async function search(query) {
    if (!query || query.length < 2) return [];

    const data = await request(`${BASE_URL}/search`, { q: query });
    if (!data || !data.data) return [];

    const results = [];
    for (const item of data.data) {
        results.push({
            id: item.slug,
            title: item.name,
            cover: item.first_image
        });
    }

    return results;
}

/**
 * Get anime details
 */
async function getDetails(animeId) {
    const data = await request(`${BASE_URL}/animes/${animeId}`);
    if (!data || !data.data) return null;

    const animeData = data.data;
    const episodes = [];

    for (const ep of animeData.episodes || []) {
        const sourcesJson = JSON.stringify(ep.sources || []);
        const epNum = ep.episode_number || 0;
        episodes.push({
            id: sourcesJson,
            number: epNum,
            title: `Bölüm ${epNum}`,
            season: animeData.season_number || 1
        });
    }

    return {
        id: animeId,
        title: animeData.name || animeId,
        description: animeData.description,
        cover: animeData.first_image,
        genres: animeData.categories || [],
        episodes: episodes,
        total_episodes: episodes.length
    };
}

/**
 * Get episodes
 */
async function getEpisodes(animeId) {
    const details = await getDetails(animeId);
    return details ? details.episodes : [];
}

/**
 * Get stream URLs for an episode
 */
async function getStreams(animeId, episodeId) {
    try {
        const sources = JSON.parse(episodeId);
        if (Array.isArray(sources)) {
            const streams = [];
            for (const src of sources) {
                const watchUrl = src.watch_url;
                if (watchUrl) {
                    streams.push({
                        url: `${BASE_URL}${watchUrl}`,
                        quality: 'auto',
                        server: src.label || 'default'
                    });
                }
            }
            if (streams.length > 0) return streams;
        }
    } catch (e) {
        // Continue to fallback
    }

    const data = await request(`${BASE_URL}/animes/${animeId}`);
    if (!data || !data.data) return [];

    const animeData = data.data;
    for (const ep of animeData.episodes || []) {
        if (String(ep.episode_number) === String(episodeId)) {
            const streams = [];
            for (const src of ep.sources || []) {
                const watchUrl = src.watch_url;
                if (watchUrl) {
                    streams.push({
                        url: `${BASE_URL}${watchUrl}`,
                        quality: 'auto',
                        server: src.label || 'default'
                    });
                }
            }
            return streams;
        }
    }

    return [];
}

module.exports = {
    search,
    getDetails,
    getEpisodes,
    getStreams
};
