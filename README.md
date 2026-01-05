# Automation SaaS MVP

A zero-cost serverless automation platform for email follow-ups and GitHub reminders.

## Features

- 🔐 Google OAuth authentication
- 📧 Gmail integration for automated follow-ups
- 🐙 GitHub integration for PR/commit reminders
- ⏰ Cron-based automation (runs even when offline)
- 🤖 AI-powered text formatting
- 💾 PostgreSQL database

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Vercel Serverless Functions
- **Database**: PostgreSQL (Neon/Supabase)
- **Auth**: Google OAuth 2.0
- **APIs**: Gmail API, GitHub API
- **AI**: OpenAI (minimal usage)

## Setup

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your credentials
   ```

3. **Set up database**
   - Create a PostgreSQL database (Neon recommended)
   - Run the schema from `/docs/schema.sql`

4. **Configure OAuth**
   - Google Cloud: Enable Gmail API, create OAuth credentials
   - GitHub: Create OAuth App in Settings > Developer settings

5. **Run locally**
   ```bash
   npm run dev
   ```

6. **Deploy to Vercel**
   ```bash
   vercel
   ```

## Project Structure

```
/api                    # Serverless functions
  /auth                 # OAuth handlers
  /integrations         # Gmail/GitHub API operations
  /automations          # Automation management
  /cron                 # Scheduled jobs
/lib                    # Shared utilities
/src                    # React frontend
  /components           # UI components
  /pages                # Route pages
/public                 # Static assets
```

## License

MIT
