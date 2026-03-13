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

## Audio System Reliability (Offline)
- **Audio Preloading**: Alert files are fetched and cached as blobs in memory on app startup via `preloadAudioFiles()`
- **Service Worker Caching**: All audio files (alert1.wav, alert2.mp3, alert3.mp3) are included in service worker cache manifest
- **Fallback Strategy**: If audio blob fails to load, the system falls back to the direct file path
- **Error Recovery**: Audio playback errors are caught and handled gracefully with automatic retry on user interaction
- **No Network Dependency**: Audio plays from locally cached blobs or service worker cache, not from network