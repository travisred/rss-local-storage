# RSS Reader with Local Storage

A simple RSS feed reader built with TypeScript that uses browser localStorage for data persistence. This can be hosted on a static HTML host.

## Features

- Read RSS/Atom feeds from multiple sources
- Mark articles as read
- Star favorite articles
- Search through articles
- Manage feed subscriptions
- All data stored locally in browser
- Export/Import data for backup or switching devices

## Getting Started

### Deployment

Copy these files to any webserver:
```
index.html
feeds.html
dist/
  ├── index.js
  ├── feeds.js
  ├── storage.js
  ├── types.js
  └── rss-fetcher.js
```

### Prerequisites (for development)

- Node.js and npm installed
- A modern web browser

### Development

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

3. Start a local server:
```bash
npm run serve
```

This will open your browser to `http://localhost:8080`

To watch for changes and automatically rebuild:
```bash
npm run watch
```

## CORS Note

Since RSS feeds are fetched from external domains, the app uses a CORS proxy (`api.allorigins.win`). For production use, you may want to set up your own proxy or use a different solution.
