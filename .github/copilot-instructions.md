# Movie Matcher - React + Vite Application

**Movie Matcher** is a real-time collaborative web application built with React, Vite, Tailwind CSS, and Supabase. Users create or join sessions to swipe through movies and find matches that everyone likes.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Build
- Install dependencies: `npm install` -- takes 1-11 seconds depending on cache. NEVER CANCEL. Set timeout to 60+ seconds.
- Build production version: `npm run build` -- takes 4-5 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Run linter: `npm run lint` -- takes 1 second. Expect linting errors (13 errors, 10 warnings as of current state). Set timeout to 30+ seconds.
- Preview production build: `npm run preview` -- serves on http://localhost:4173/

### Development Environment
- **CRITICAL**: Create `.env` file with required environment variables before running:
  ```env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  VITE_TMDB_API_KEY=your_tmdb_api_key
  ```
- Start development server: `npm run dev` -- serves on http://localhost:5173/ with hot reload, ready in ~560ms
- NEVER CANCEL development server builds - they complete in under 1 second
- Server runs with `--host` flag to expose on network interfaces
- **Expected Errors**: Console errors for Supabase/TMDb API connections are normal with dummy credentials

### Validation and Testing
- **MANUAL VALIDATION REQUIREMENT**: After making changes, ALWAYS test these user scenarios:
  1. Navigate to home page at http://localhost:5173/ and verify it loads correctly
  2. Click "Create New Session" button - expect error alert without real Supabase credentials (this is normal)
  3. Click "Join Session" and verify the join code input form appears
  4. Test navigation between Home, Join Session, and Profile pages
  5. Verify theme toggle works (dark/light mode switch in header)
- **UI Validation**: Take screenshots after UI changes to verify visual correctness
- **Environment Dependencies**: App displays interface without real API keys but shows connection errors in console - this is expected for testing
- **Error Dialog**: "Failed to create session" alert is expected when testing without valid Supabase credentials

### Build and Deployment
- Production build output goes to `dist/` directory
- Bundle size warning expected: main chunk ~704KB (normal for React app with dependencies)
- Deployment configured for Netlify (see `netlify.toml`)
- No test framework configured - rely on manual functional testing

## Important File Structure

### Source Code Organization
```
src/
├── api/               # API integrations
│   ├── supabase.js   # Supabase client setup
│   └── tmdb.js       # TMDb API wrapper
├── components/        # Reusable UI components
│   ├── Configuring/  # Session configuration components
│   ├── Dashboard/    # User dashboard components
│   ├── Lobby/        # Session lobby components
│   └── Session/      # Movie matching session components
├── pages/            # Main application pages
│   ├── Home.jsx      # Landing page with create/join options
│   ├── JoinSession.jsx # Join existing session with code
│   ├── Lobby.jsx     # Session lobby for participants
│   ├── ConfigureSession.jsx # Host configuration page
│   ├── Session.jsx   # Movie swiping interface
│   └── MatchFound.jsx # Results page showing matches
├── stores/           # Zustand state management
│   └── userStore.jsx # User state and session management
├── utils/            # Utility functions
│   └── matching_utilities.js # Core matching logic
└── hooks/            # Custom React hooks
    └── useSession.jsx # Session management hook
```

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite build configuration with React and Tailwind
- `eslint.config.js` - ESLint rules for React development
- `netlify.toml` - Netlify deployment configuration

## Key Application Features

### Session Management
- **Create Session**: Generates unique join codes, stores in Supabase
- **Join Session**: Users enter 6-character codes or scan QR codes
- **Real-time Updates**: Uses Supabase subscriptions for collaborative features
- **User Management**: Auto-generated usernames, profile avatars via Dicebear API

### Movie Matching Process
1. **Configuration**: Host selects streaming platforms and genres via TMDb API
2. **Movie Discovery**: Fetches movies based on selected criteria
3. **Swiping Interface**: Touch-friendly like/dislike interface
4. **Match Detection**: Real-time checking when all users vote on same movie
5. **Results**: Display movies liked by all participants

### Technical Integration
- **Supabase**: Real-time database, user management, collaborative features
- **TMDb API**: Movie data, genres, streaming platform availability
- **Tailwind CSS**: Responsive design with custom theme system
- **Zustand**: Lightweight state management for user sessions

## Common Tasks and Commands

### Development Workflow
```bash
# Initial setup
npm install
# Create .env file with API keys
npm run dev

# Code quality
npm run lint  # Check for linting errors
npm run build # Verify production build works

# Testing changes
# 1. Start dev server: npm run dev
# 2. Navigate to http://localhost:5173/
# 3. Test create/join session flows
# 4. Verify UI responsiveness on mobile/desktop
```

### Troubleshooting
- **Supabase Errors**: Expected if using dummy API keys - app shows UI but can't persist data
- **TMDb API Errors**: Expected if using dummy API keys - movie data won't load
- **Linting Errors**: Current codebase has intentional linting issues, focus on functional changes
- **Build Warnings**: Large bundle size warning is normal for this application

### Making Changes
- **API Integration**: Edit files in `src/api/` for external service connections
- **UI Components**: Most reusable components in `src/components/`
- **Page Logic**: Main application flows in `src/pages/`
- **State Management**: User and session state in `src/stores/userStore.jsx`
- **Styling**: Tailwind classes used throughout, custom theme in app.css

### Validation Requirements
- ALWAYS test navigation between all main pages after UI changes
- ALWAYS verify responsive design works on different screen sizes
- ALWAYS check browser console for new errors after code changes
- ALWAYS test both light and dark theme modes
- Take screenshots of UI changes to validate visual correctness

## Expected Timing and Performance
- **npm install**: 1-11 seconds (depending on cache) - NEVER CANCEL, set timeout to 60+ seconds
- **npm run build**: 4-5 seconds - NEVER CANCEL, set timeout to 30+ seconds  
- **npm run lint**: ~1 second - NEVER CANCEL, set timeout to 30+ seconds
- **npm run dev**: ~560ms startup - NEVER CANCEL, development server continues running
- **Hot reload**: <1 second for most changes during development

## Environment Requirements
- **Node.js**: Compatible with current LTS (project uses ES modules)
- **API Keys**: Supabase URL, Supabase anon key, TMDb API key required for full functionality
- **Network**: App loads external resources (Dicebear avatars, API endpoints)
- **Browser**: Modern browser with ES6+ support, works in Chrome, Firefox, Safari