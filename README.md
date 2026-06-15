# Anime Scraper - Node.js/Express.js

A working anime scraper using the AllAnime API, ported from the Weeb CLI project with improvements from ani-cli.

## Features

- ✅ Search for anime
- ✅ Get anime details
- ✅ Get episode lists
- ✅ Get streaming URLs for episodes (with curl fallback for CAPTCHA)
- ✅ RESTful API with Express.js

## Installation

```bash
cd anime-scraper-nodejs
npm install
```

## Deployment

### Local Development

```bash
npm start
```

The server will run on `http://localhost:3000`

### Vercel Deployment

This project is configured for Vercel deployment. To deploy:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

The project includes:
- `vercel.json` - Vercel configuration
- `package.json` - Build scripts and dependencies
- `server.js` - Express server configured for Vercel

## Usage

### Start the API Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### Test the Scraper

```bash
npm test
```

This will run a test script that:
1. Searches for "One Piece"
2. Gets anime details
3. Gets episode list
4. Gets stream URLs for the first episode

## API Endpoints

### Health Check
```
GET /health
```

### AllAnime Endpoints
```
GET /allanime/search?q=One Piece
GET /allanime/anime/:id
GET /allanime/anime/:id/episodes
GET /allanime/anime/:id/streams?episode=1
GET /allanime/anime/:id/episode/:episodeId/streams
```

### Weeb Endpoints
```
GET /weeb/search?q=One Piece
GET /weeb/anime/:id
GET /weeb/anime/:id/episodes
GET /weeb/anime/:id/streams?episode=1
GET /weeb/anime/:id/episode/:episodeId/streams
```

## Example Usage

### Using curl

```bash
# AllAnime - Search for anime
curl "http://localhost:3000/allanime/search?q=One Piece"

# AllAnime - Get anime details
curl "http://localhost:3000/allanime/anime/anime-id-here"

# AllAnime - Get episodes
curl "http://localhost:3000/allanime/anime/anime-id-here/episodes"

# AllAnime - Get streams for episode 1
curl "http://localhost:3000/allanime/anime/anime-id-here/streams?episode=1"

# Weeb - Search for anime
curl "http://localhost:3000/weeb/search?q=One Piece"

# Weeb - Get anime details
curl "http://localhost:3000/weeb/anime/one-piece"

# Weeb - Get episodes
curl "http://localhost:3000/weeb/anime/one-piece/episodes"

# Weeb - Get streams for episode 1
curl "http://localhost:3000/weeb/anime/one-piece/streams?episode=1"
```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

// AllAnime - Search
const search = await axios.get('http://localhost:3000/allanime/search?q=One Piece');
console.log(search.data.results);

// AllAnime - Get details
const details = await axios.get(`http://localhost:3000/allanime/anime/${search.data.results[0].id}`);
console.log(details.data);

// AllAnime - Get streams
const streams = await axios.get(`http://localhost:3000/allanime/anime/${search.data.results[0].id}/streams?episode=1`);
console.log(streams.data.streams);

// Weeb - Search
const weebSearch = await axios.get('http://localhost:3000/weeb/search?q=One Piece');
console.log(weebSearch.data.results);

// Weeb - Get details
const weebDetails = await axios.get(`http://localhost:3000/weeb/anime/${weebSearch.data.results[0].id}`);
console.log(weebDetails.data);

// Weeb - Get streams
const weebStreams = await axios.get(`http://localhost:3000/weeb/anime/${weebSearch.data.results[0].id}/streams?episode=1`);
console.log(weebStreams.data.streams);
```

## Current Status

### Working Features
- ✅ **AllAnime Provider**: Search, details, episodes, and streams with curl fallback for CAPTCHA handling
- ✅ **Weeb Provider**: Search, details, episodes, and streams without CAPTCHA requirements
- ✅ **Provider-specific Routes**: API endpoints organized by provider (/allanime/, /weeb/)

## Notes

### AllAnime Provider
- Uses the AllAnime API (api.allanime.day)
- Implements curl fallback mechanism from ani-cli to handle CAPTCHA protection
- Uses persisted GraphQL queries with proper hash for stream endpoints
- AES-256-CTR decryption for encrypted "tobeparsed" response fields
- Multiple fallback strategies: persisted query → curl → POST → curl POST
- Proper headers (Referer, Origin) matching the ani-cli implementation

### Weeb Provider
- Uses the Weeb API (anime-api.ewgsta.workers.dev)
- Provides direct stream URLs without CAPTCHA protection
- Multiple stream sources available (Primary CDN, Mirror 1, Mirror 2)
- No additional authentication or headers required

### API Structure
- Provider-specific routes for clear separation between sources
- Both providers support the same endpoint structure
- Health check endpoint lists available providers

## License

MIT
