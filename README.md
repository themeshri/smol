# SMOL - Twitter Engagement Growth Tracker

Track Twitter engagement growth over time. Score users based on engagement deltas, not absolute numbers.

## Features

- **Delta-Based Scoring**: Track engagement growth between scrapes, not absolute metrics
- **Automated Scraping**: Set cooldown periods (1h, 6h, 12h, 24h) for automatic periodic scraping
- **Project-Based Tracking**: Monitor multiple projects with different keywords
- **24-Hour Window**: Only track tweets from the last 24 hours
- **Leaderboards**: See top performers per project
- **User Analytics**: Detailed score history and tweet tracking per user

## Points Formula

Points are awarded based on engagement growth (deltas):

```
Points = (likes_delta × 1) + (retweets_delta × 3) + (replies_delta × 2) +
         (quotes_delta × 3) + (bookmarks_delta × 1.5)
```

Negative deltas are ignored (score only increases).

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=smol
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# Apify API
APIFY_API_TOKEN=your_apify_token
```

### 3. Setup Database

```bash
npx tsx scripts/setup-database.ts
```

This creates the `smol` database and all tables.

### 4. Create Test Project (Optional)

```bash
npx tsx scripts/create-test-project.ts
```

Creates a test project with `$uranus` keyword.

## Usage

### Development Server

```bash
npm run dev
```

Visit http://localhost:3003

### Test Scraping

```bash
npx tsx scripts/test-scrape.ts
```

Runs a scrape for the most recent active project and shows results.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
smol/
├── app/
│   ├── api/
│   │   ├── projects/          # Project CRUD endpoints
│   │   ├── scrape/            # Manual scrape trigger
│   │   └── users/             # User details endpoint
│   ├── projects/              # Projects list and detail pages
│   ├── users/                 # User detail pages
│   └── layout.tsx             # Root layout
├── lib/
│   ├── pool.ts                # PostgreSQL connection
│   ├── apify-client.ts        # Apify Tweet Scraper V2 setup
│   └── scraping/
│       ├── delta-calculator.ts    # Delta and points calculation
│       └── scrape-and-score.ts    # Main scraping workflow
├── database/
│   └── schema.sql             # Database schema
└── scripts/
    ├── setup-database.ts      # Database initialization
    ├── create-test-project.ts # Create test project
    └── test-scrape.ts         # Test scraping workflow
```

## Database Schema

### Projects
- Store projects with keywords and scraping configuration
- Configurable cooldown periods (1h, 6h, 12h, 24h)
- Can be paused/resumed

### Users
- Twitter user information (username, followers, verification status)

### Tweets
- Store tweets with current and previous engagement metrics
- Track deltas automatically on each scrape
- Mark tweets as inactive after 24 hours

### User Project Scores
- Total accumulated score per user per project
- Track tweet count and last earnings

### Score History
- Detailed log of all point earnings
- Show which deltas generated points
- Group by scrape session

## How It Works

1. **Project Creation**: Create a project with keywords and cooldown period
2. **Scraping**:
   - Manually trigger or wait for cooldown period
   - Fetch tweets from Apify Tweet Scraper V2
   - For new tweets: award full points based on current engagement
   - For existing tweets: calculate deltas and award points for growth
3. **Scoring**:
   - Calculate engagement deltas (current - previous)
   - Ignore negative deltas
   - Apply weighted formula to get points
   - Update user's total score
4. **Tracking**:
   - Mark tweets >24h old as inactive
   - Only process active tweets in future scrapes
   - Maintain score history for analytics

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project (pause/resume, change cooldown)
- `GET /api/projects/[id]/leaderboard` - Get project leaderboard

### Scraping
- `POST /api/scrape/trigger` - Manually trigger scrape for a project

### Users
- `GET /api/users/[id]?project_id=X` - Get user details and score history

## Testing Results

Example scrape output:

```
🔍 Starting scrape for project...
📋 Project: Uranus Token Tracker
🔑 Keywords: $uranus, uranus, #uranus
📥 Scraped 100 tweets from Apify
✨ New tweet 1986121619471794297
📈 Updated tweet 1986120486913298664 (+1.00 pts)
⏰ Tweet 1985733022864347175 is now inactive (>24h old)

✅ Scrape complete!
   New tweets: 6
   Updated tweets: 75
   Points awarded: 13.00

🏆 TOP 5 LEADERBOARD
1. @Overdose_AI - 195.50 pts (1 tweets)
2. @Kura1AmA_ - 156.50 pts (1 tweets)
3. @geanpierresm - 95.50 pts (2 tweets)
4. @Palgrani2 - 91.00 pts (1 tweets)
5. @SigmaDollarBoy - 75.00 pts (1 tweets)
```

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **PostgreSQL** (direct connection via pg)
- **Apify Tweet Scraper V2**
- **TailwindCSS**

## Key Differences from pump_kaito

SMOL is inspired by pump_kaito but simplified:

- No authentication (public leaderboards)
- No token rewards (points only)
- Delta-based scoring instead of absolute impressions
- 24-hour tweet tracking window
- Projects instead of campaigns
- No delete functionality (pause only)
- Reused: Database connection, Apify setup, calculation concepts
- New: All UI components built from scratch

## License

MIT
