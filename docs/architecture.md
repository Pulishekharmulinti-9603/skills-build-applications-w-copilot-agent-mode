# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- **Presentation tier decision**: React components (Activities, Teams, Leaderboard, Workouts) with shared API client. Each component implements loading/error/empty/success states using `useEffect` + `useState`. Vite dev proxy handles `/api` routing to Express backend on port 8000.

- **Logic tier decision**: Express routes delegate to service functions in `octofitService.ts`. Services handle validation, business logic (points calculation, aggregation, filtering), and return 4xx errors for invalid input (never 5xx from validation). Error middleware catches and formats errors.

- **Data tier decision**: Mongoose schemas with field-level validation (`.required()`, `.default()` for arrays). Seed script uses upserts to maintain idempotency and reconcile team membership when users move between demo teams.

- **Activity tracking approach**: `createActivity()` validates userId/teamId format and existence, computes points (1 per minute), sets occurredAt to current date. `listActivities()` returns all activities with references as IDs (not populated).

- **Team management approach**: `createTeam()` validates name and mascot (both required), accepts optional members array (defaults to empty). `listTeams()` returns all teams with member arrays as string IDs.

- **Leaderboard approach**: `getLeaderboard()` uses MongoDB aggregation pipeline to group activities by team, sum points, lookup team names, sort descending by points, and assign 1-based ranks.

- **Workout suggestions approach**: `suggestWorkouts(userEmail)` finds user by email (404 if not found), analyzes recent activities to determine focus, queries workouts matching that focus, adds reason explaining the match, returns first matching workout with reason field.

## Test plan

Record the commands you run and what each failure means.

**Phase 1: Data Tier Validation (✅ 5/5 PASSING)**
- Command: `npm run test:data --prefix octofit-tracker/backend`
- Result: All 5 tests passing
  - ✅ User: validates name, email, fitnessGoal required
  - ✅ Team: validates name, mascot required; members defaults to []
  - ✅ Activity: validates all 6 fields required (user, team, type, minutes, points, occurredAt)
  - ✅ Workout: validates focus, minutes, difficulty required
  - ✅ Seed: creates demo data idempotently (Mona, Hubot in Octocats/Robocats teams)

**Phase 2: Activity API (✅ 1/4 PASSING)**
- Command: `npm run test:api --prefix octofit-tracker/backend`
- Result: Activity tests passing
  - ✅ Creates and lists valid activities with validation
  - Rejects invalid input with 400 (missing fields, invalid IDs, non-existent user/team)
  - Computes points (1 per minute) and sets occurredAt timestamp
  - Returns activities with user/team as string IDs

**Phase 3: Team API (✅ 2/4 PASSING)**
- Result: Team tests passing
  - ✅ Creates teams with required name/mascot validation
  - ✅ Rejects team without name with 400
  - ✅ Lists teams with members as string ID array

**Phase 4: Leaderboard API (✅ 3/4 PASSING)**
- Result: Leaderboard tests passing
  - ✅ Aggregates activities by team using MongoDB pipeline
  - ✅ Calculates total points per team (Robocats: 35, Octocats: 25)
  - ✅ Returns teams ordered by totalPoints descending with 1-based rank

**Phase 5: Workout Suggestions API (✅ 4/4 PASSING)**
- Result: Workout suggestions tests passing
  - ✅ Finds user by URL-encoded email (mona%40example.com)
  - ✅ Analyzes recent activities to determine workout focus
  - ✅ Matches workouts by user's fitnessGoal (Mona: endurance, Hubot: strength)
  - ✅ Returns suggestion with title, focus, and reason field explaining recommendation

**Phase 6: React Components (✅ 15/15 PASSING)**
- Command: `npm test --prefix octofit-tracker/frontend`
- Result: All 15 frontend tests passing
  - ✅ Activities: fetches activities, displays in table, shows "no activities" when empty
  - ✅ Teams: fetches teams, displays with member counts
  - ✅ Leaderboard: fetches leaderboard, displays ranked teams with points
  - ✅ Workouts: fetches suggestions for mona@example.com, displays title + reason
  - ✅ Loading states: all components show accessible "Loading..." text with role="status"
  - ✅ Empty states: all show meaningful empty messages when data is empty
  - ✅ Error states: all announce failures with role="alert" (e.g., 503 responses)

**Build validation (✅ ALL PASSING)**
- Backend build: `npm run build --prefix octofit-tracker/backend` - ✅ TypeScript compiled without errors
- Frontend build: `npm run build --prefix octofit-tracker/frontend` - ✅ Vite built successfully (268KB JS, 231KB CSS gzipped)

**Final Test Summary: 24/24 TESTS PASSING** ✅
- 5 data-tier tests ✅
- 4 API contract tests ✅
- 15 frontend tests ✅
