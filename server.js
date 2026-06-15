const express = require('express');
const cors = require('cors');
const allanime = require('./allanime');
const weeb = require('./weeb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', providers: ['allanime', 'weeb'] });
});

// ========== AllAnime Routes ==========
// Search for anime
app.get('/allanime/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        console.log(`[AllAnime] Searching for: ${q}`);
        const results = await allanime.search(q);

        res.json({
            success: true,
            query: q,
            count: results.length,
            results: results
        });
    } catch (error) {
        console.error('[AllAnime] Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search for anime',
            message: error.message
        });
    }
});

// Get anime details
app.get('/allanime/anime/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[AllAnime] Getting details for anime ID: ${id}`);
        const details = await allanime.getDetails(id);

        if (!details) {
            return res.status(404).json({
                success: false,
                error: 'Anime not found'
            });
        }

        res.json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error('[AllAnime] Details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get anime details',
            message: error.message
        });
    }
});

// Get episodes for an anime
app.get('/allanime/anime/:id/episodes', async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[AllAnime] Getting episodes for anime ID: ${id}`);
        const episodes = await allanime.getEpisodes(id);

        res.json({
            success: true,
            anime_id: id,
            count: episodes.length,
            episodes: episodes
        });
    } catch (error) {
        console.error('[AllAnime] Episodes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get episodes',
            message: error.message
        });
    }
});

// Get stream URLs for an episode
app.get('/allanime/anime/:id/episode/:episodeId/streams', async (req, res) => {
    try {
        const { id, episodeId } = req.params;

        console.log(`[AllAnime] Getting streams for anime ID: ${id}, episode: ${episodeId}`);
        const streams = await allanime.getStreams(id, episodeId);

        res.json({
            success: true,
            anime_id: id,
            episode_id: episodeId,
            count: streams.length,
            streams: streams
        });
    } catch (error) {
        console.error('[AllAnime] Streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stream URLs',
            message: error.message
        });
    }
});

// Get stream URLs using episode number
app.get('/allanime/anime/:id/streams', async (req, res) => {
    try {
        const { id } = req.params;
        const { episode } = req.query;

        if (!episode) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "episode" is required'
            });
        }

        const episodeId = `${id}::ep=${episode}`;

        console.log(`[AllAnime] Getting streams for anime ID: ${id}, episode: ${episode}`);
        const streams = await allanime.getStreams(id, episodeId);

        res.json({
            success: true,
            anime_id: id,
            episode_number: episode,
            count: streams.length,
            streams: streams
        });
    } catch (error) {
        console.error('[AllAnime] Streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stream URLs',
            message: error.message
        });
    }
});

// ========== Weeb Routes ==========
// Search for anime
app.get('/weeb/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        console.log(`[Weeb] Searching for: ${q}`);
        const results = await weeb.search(q);

        res.json({
            success: true,
            query: q,
            count: results.length,
            results: results
        });
    } catch (error) {
        console.error('[Weeb] Search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search for anime',
            message: error.message
        });
    }
});

// Get anime details
app.get('/weeb/anime/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[Weeb] Getting details for anime ID: ${id}`);
        const details = await weeb.getDetails(id);

        if (!details) {
            return res.status(404).json({
                success: false,
                error: 'Anime not found'
            });
        }

        res.json({
            success: true,
            data: details
        });
    } catch (error) {
        console.error('[Weeb] Details error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get anime details',
            message: error.message
        });
    }
});

// Get episodes for an anime
app.get('/weeb/anime/:id/episodes', async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[Weeb] Getting episodes for anime ID: ${id}`);
        const episodes = await weeb.getEpisodes(id);

        res.json({
            success: true,
            anime_id: id,
            count: episodes.length,
            episodes: episodes
        });
    } catch (error) {
        console.error('[Weeb] Episodes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get episodes',
            message: error.message
        });
    }
});

// Get stream URLs for an episode
app.get('/weeb/anime/:id/episode/:episodeId/streams', async (req, res) => {
    try {
        const { id, episodeId } = req.params;

        console.log(`[Weeb] Getting streams for anime ID: ${id}, episode: ${episodeId}`);
        const streams = await weeb.getStreams(id, episodeId);

        res.json({
            success: true,
            anime_id: id,
            episode_id: episodeId,
            count: streams.length,
            streams: streams
        });
    } catch (error) {
        console.error('[Weeb] Streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stream URLs',
            message: error.message
        });
    }
});

// Get stream URLs using episode number
app.get('/weeb/anime/:id/streams', async (req, res) => {
    try {
        const { id } = req.params;
        const { episode } = req.query;

        if (!episode) {
            return res.status(400).json({
                success: false,
                error: 'Query parameter "episode" is required'
            });
        }

        const episodeId = `${id}::ep=${episode}`;

        console.log(`[Weeb] Getting streams for anime ID: ${id}, episode: ${episode}`);
        const streams = await weeb.getStreams(id, episodeId);

        res.json({
            success: true,
            anime_id: id,
            episode_number: episode,
            count: streams.length,
            streams: streams
        });
    } catch (error) {
        console.error('[Weeb] Streams error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stream URLs',
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found' 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Anime Scraper API running on http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /health - Health check`);
    console.log(`  GET /allanime/search?q=query - Search anime (AllAnime)`);
    console.log(`  GET /allanime/anime/:id - Get anime details (AllAnime)`);
    console.log(`  GET /allanime/anime/:id/episodes - Get episodes (AllAnime)`);
    console.log(`  GET /allanime/anime/:id/streams?episode=1 - Get streams by episode number (AllAnime)`);
    console.log(`  GET /allanime/anime/:id/episode/:episodeId/streams - Get streams by episode ID (AllAnime)`);
    console.log(`  GET /weeb/search?q=query - Search anime (Weeb)`);
    console.log(`  GET /weeb/anime/:id - Get anime details (Weeb)`);
    console.log(`  GET /weeb/anime/:id/episodes - Get episodes (Weeb)`);
    console.log(`  GET /weeb/anime/:id/streams?episode=1 - Get streams by episode number (Weeb)`);
    console.log(`  GET /weeb/anime/:id/episode/:episodeId/streams - Get streams by episode ID (Weeb)`);
});
