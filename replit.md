# Shelf Life Timer Board

## Overview

A progressive web application (PWA) designed as an offline-first shelf life timer board, optimized for Android tablet use in commercial kitchen or food service environments. The app allows users to track multiple countdown timers for food items with configurable durations, displaying remaining time with visual status indicators (normal, warning, expired).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Vanilla JavaScript with Vite as the build tool and development server
- **Rendering**: Direct DOM manipulation without a frontend framework
- **State Management**: Local state object persisted to localStorage for offline data retention
- **ID Generation**: nanoid library for generating unique item identifiers

### PWA Implementation
- **Service Worker**: Cache-first strategy for offline functionality (`public/sw.js`)
- **Web App Manifest**: Configured for standalone display mode with dark theme
- **Offline Storage**: localStorage for timer state persistence

### UI/UX Design
- **Layout**: CSS Grid-based responsive layout (2-column grid for timer cards)
- **Styling**: CSS custom properties (variables) for theming with dark mode default
- **Touch Optimization**: Disabled tap highlighting and user-select for tablet touch interface
- **Admin Panel**: Hidden settings screen for managing timer items and warning thresholds

### Data Model
Timer items contain:
- `id`: Unique identifier (nanoid)
- `name`: Display name for the item
- `duration`: Timer duration in minutes
- `startTime`: Timestamp when timer was started/reset

### Configuration
- Vite dev server configured on port 5000 with public host access
- Warning threshold configurable (default 15 minutes before expiration)

## External Dependencies

### Build Tools
- **Vite 6.2.2**: Development server and build tooling

### Runtime Libraries
- **nanoid**: Lightweight unique ID generation (imported in main.js)

### Browser APIs
- **localStorage**: Client-side data persistence
- **Service Worker API**: Offline caching and PWA functionality
- **Cache API**: Asset caching for offline access