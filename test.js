const allanime = require('./allanime');
const weeb = require('./weeb');

async function testAllAnime() {
    console.log('=== Testing AllAnime Provider ===\n');

    try {
        // Test 1: Search
        console.log('Test 1: Searching for "One Piece"');
        const searchResults = await allanime.search('One Piece');
        console.log(`Found ${searchResults.length} results`);
        if (searchResults.length > 0) {
            console.log('First result:', JSON.stringify(searchResults[0], null, 2));
        }
        console.log('');

        if (searchResults.length === 0) {
            console.log('No search results found. Skipping AllAnime tests.');
            return;
        }

        const animeId = searchResults[0].id;

        // Test 2: Get details
        console.log(`Test 2: Getting details for anime ID: ${animeId}`);
        const details = await allanime.getDetails(animeId);
        if (details) {
            console.log(`Title: ${details.title}`);
            console.log(`Description: ${details.description?.substring(0, 100)}...`);
            console.log(`Total episodes: ${details.total_episodes}`);
            console.log(`Cover: ${details.cover}`);
        }
        console.log('');

        // Test 3: Get episodes
        console.log(`Test 3: Getting episodes for anime ID: ${animeId}`);
        const episodes = await allanime.getEpisodes(animeId);
        console.log(`Found ${episodes.length} episodes`);
        if (episodes.length > 0) {
            console.log('First 3 episodes:');
            episodes.slice(0, 3).forEach(ep => {
                console.log(`  ${ep.number}: ${ep.title} (ID: ${ep.id})`);
            });
        }
        console.log('');

        // Test 4: Get streams
        if (episodes.length > 0) {
            const episodeId = episodes[0].id;
            console.log(`Test 4: Getting streams for episode: ${episodeId}`);
            const streams = await allanime.getStreams(animeId, episodeId);
            console.log(`Found ${streams.length} streams`);
            if (streams.length > 0) {
                console.log('First stream:', JSON.stringify(streams[0], null, 2));
            }
            console.log('');
        }

        console.log('=== AllAnime tests completed successfully ===\n');

    } catch (error) {
        console.error('AllAnime test failed:', error.message);
        console.error(error.stack);
    }
}

async function testWeeb() {
    console.log('=== Testing Weeb Provider ===\n');

    try {
        // Test 1: Search
        console.log('Test 1: Searching for "One Piece"');
        const searchResults = await weeb.search('One Piece');
        console.log(`Found ${searchResults.length} results`);
        if (searchResults.length > 0) {
            console.log('First result:', JSON.stringify(searchResults[0], null, 2));
        }
        console.log('');

        if (searchResults.length === 0) {
            console.log('No search results found. Skipping Weeb tests.');
            return;
        }

        const animeId = searchResults[0].id;

        // Test 2: Get details
        console.log(`Test 2: Getting details for anime ID: ${animeId}`);
        const details = await weeb.getDetails(animeId);
        if (details) {
            console.log(`Title: ${details.title}`);
            console.log(`Description: ${details.description?.substring(0, 100)}...`);
            console.log(`Total episodes: ${details.total_episodes}`);
            console.log(`Cover: ${details.cover}`);
        }
        console.log('');

        // Test 3: Get episodes
        console.log(`Test 3: Getting episodes for anime ID: ${animeId}`);
        const episodes = await weeb.getEpisodes(animeId);
        console.log(`Found ${episodes.length} episodes`);
        if (episodes.length > 0) {
            console.log('First 3 episodes:');
            episodes.slice(0, 3).forEach(ep => {
                console.log(`  ${ep.number}: ${ep.title} (ID: ${ep.id})`);
            });
        }
        console.log('');

        // Test 4: Get streams
        if (episodes.length > 0) {
            const episodeId = episodes[0].id;
            console.log(`Test 4: Getting streams for episode: ${episodeId}`);
            const streams = await weeb.getStreams(animeId, episodeId);
            console.log(`Found ${streams.length} streams`);
            if (streams.length > 0) {
                console.log('First stream:', JSON.stringify(streams[0], null, 2));
            }
            console.log('');
        }

        console.log('=== Weeb tests completed successfully ===\n');

    } catch (error) {
        console.error('Weeb test failed:', error.message);
        console.error(error.stack);
    }
}

async function testScraper() {
    await testAllAnime();
    await testWeeb();
    console.log('=== All provider tests completed ===');
}

// Run tests
testScraper();
