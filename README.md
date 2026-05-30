# INVESTIGATE.AGENT - Enterprise AI Operations Platform

A modular React-based enterprise AI monitoring and automation platform that connects to multiple data sources (GitHub, PostgreSQL, Slack, Datadog, Jira, Sentry) for real-time issue detection and auto-fix capabilities.

## Project Structure

```
.
├── index.html              # Main HTML entry point
├── index.jsx               # React entry point
├── App.jsx                 # Main application component with all logic
├── components.jsx          # Reusable UI components
├── constants.js            # Data constants (source definitions, issue pool)
├── styles.css              # Global styles and CSS classes
├── package.json            # Dependencies and project metadata
└── README.md               # This file
```

## File Descriptions

### `index.html`
- Main HTML file served to the browser
- Loads Tabler Icons CDN
- Links to `styles.css` for styling
- Contains the root div for React

### `index.jsx`
- React entry point that mounts the App component
- Uses React 18's `createRoot` API

### `App.jsx`
- Main application component containing all business logic
- State management for tabs, connections, monitoring, chat, and issues
- Event handlers for connecting to repos, fixing issues, and chat
- All UI rendering logic for:
  - Connect tab (repository connection)
  - Dashboard (monitoring overview)
  - Agent (AI chat interface)
  - Issues (detected issues list)

### `components.jsx`
- Reusable, self-contained UI components:
  - `Dot` - Status indicator
  - `Spin` - Loading spinner
  - `Dots` - Animated dots
  - `Badge` - Level badges (error/warning/info)
  - `ToolBadge` - Tool/source badges with status
  - `LatBar` - Latency progress bar
  - `DiffView` - Code diff viewer
  - `Popup` - Alert notifications popup
  - `ChatMsg` - Chat message display

### `constants.js`
- `SOURCE_DEFS` - Configuration for 6 monitoring sources (GitHub, PostgreSQL, Slack, Datadog, Jira, Sentry)
- `ISSUE_POOL` - Mock issue data for demo/monitoring
- `mkIssue` - Issue factory function

### `styles.css`
- Global CSS with animations (nexSpin, nexPulse, nexFade, etc.)
- Scrollbar styling
- Component classes:
  - `.nx-tab` - Tab button styles
  - `.nx-btn` - Primary button
  - `.nx-ghost` - Ghost button
  - `.nx-input` - Input field
  - `.chip` - Chip/tag styles

### `package.json`
- Dependencies: React, React DOM
- Dev dependencies: Vite, Vite React plugin
- Scripts for dev, build, and preview

## Key Features

✅ **Continuous Monitoring** - Watch all enterprise sources 24/7
✅ **Auto-Fix Engine** - AI-powered diagnostics with diff viewer
✅ **Unified Dashboard** - Live metrics and health status
✅ **Smart Chat Agent** - Query issues and get actionable insights
✅ **Alert Popups** - Real-time notifications for critical issues

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## Architecture Notes

- **Component-based** - Small, focused components for reusability
- **Hooks-based** - Uses React hooks for state and effects
- **Modular structure** - Separation of constants, components, and logic
- **Styling approach** - CSS classes + inline styles for dynamic values
- **API integration** - Connects to Claude API for AI responses
- **Mock data** - ISSUE_POOL for demo purposes

## Browser Requirements

- Modern browser with ES6 module support
- Requires Tabler Icons CDN (loaded in HTML)
- Needs Claude API key for AI features
