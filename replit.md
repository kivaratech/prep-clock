# Shelf Life Timer Board

## Overview

A Progressive Web App (PWA) designed as an offline-first shelf life timer board, primarily intended for Android tablets. The application allows users to track expiration times for various food items (like ingredients in a commercial kitchen setting), displaying countdown timers in a grid layout with visual warnings as items approach expiration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla JavaScript with Vite as the build tool and development server
- **Styling**: Plain CSS with CSS custom properties (variables) for theming
- **State Management**: Simple in-memory state object with localStorage persistence
- **ID Generation**: Uses `nanoid` for generating unique item identifiers

### Application Structure
- **Single Page Application**: All UI rendered in a single `index.html` with JavaScript-driven updates
- **Component Pattern**: Timer grid displays items as cards; admin screen handles settings and item management
- **Offline-First Design**: Service Worker (`public/sw.js`) caches assets for offline functionality

### PWA Configuration
- **Manifest**: Configured for standalone display mode with dark theme
- **Service Worker**: Cache-first strategy for static assets
- **Target Platform**: Optimized for Android tablets with touch-friendly UI (disabled zoom, tap highlight removal)

### Data Model
Items are stored with:
- `id`: Unique identifier (nanoid)
- `name`: Display name
- `duration`: Timer duration in minutes
- `startTime`: Timestamp when timer was started

Global settings include a configurable warning threshold.

### Key Features
- Grid-based timer display (2-column layout)
- Visual status indicators (normal, warning, expired states via CSS color variables)
- Admin settings panel for managing items and global configuration
- Persistent state across browser sessions

## External Dependencies

### Build Tools
- **Vite** (^6.2.2): Development server and production bundler

### Runtime Dependencies
- **nanoid**: Lightweight unique ID generator (imported in main.js but not listed in package.json - needs to be added)

### Browser APIs
- **localStorage**: State persistence
- **Service Worker API**: Offline caching
- **Web App Manifest**: PWA installation support

### No Backend Required
The application is entirely client-side with no server dependencies beyond static file serving.

## Offline-First Implementation

### Zero Network Dependencies
- **No External Fonts**: System fonts used instead of Google Fonts (removed googleapis.com, gstatic.com dependencies)
- **No External Icons**: Manifest removed CDN favicon reference (was cdn.replit.com)
- **All Assets Local**: HTML, CSS, JS, and audio files cached by service worker

### Service Worker Caching Strategy
- **Cache-First for Static Assets**: Critical app files (HTML, JS, CSS, manifest) cached first, then network
- **Fallback on Offline**: If offline, app loads from cache without network request
- **Auto-Cache Updates**: New assets automatically cached when online
- **Graceful Degradation**: App continues running on stale cache if network unavailable
- **Cache Busting**: Version incremented (v2) to force fresh cache when deployed

### Audio System Reliability (Offline)
- **Audio Preloading**: Alert files fetched with 5-second timeout and cached as blobs in memory
- **Service Worker Caching**: All audio files (alert1.wav, alert2.mp3, alert3.mp3) in critical cache manifest
- **Dual Fallback**: Uses blob URL if available, otherwise direct path from service worker cache
- **Error Recovery**: Gracefully falls back to direct file path if blob creation fails
- **No Network Required**: Audio plays from local cache, never requires internet

### Startup Flow (Offline-Ready)
1. Service worker serves index.html from cache
2. CSS and JS load from cache (no external fonts/CDN)
3. Local storage restores app state (timers, settings, items)
4. Audio files already cached—ready to play immediately
5. App fully functional with zero network requests