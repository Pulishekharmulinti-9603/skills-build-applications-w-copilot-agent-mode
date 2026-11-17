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

- **Activity tracking approach**: `createActivity()` validates userId/teamId format and existence, computes points (1 per minute), sets occurredAt to current date. `listActivities()` returns all activities with user/team references populated.

- **Team management approach**: `createTeam()` validates name and mascot (both required), accepts optional members array (defaults to empty). `listTeams()` returns all teams with member arrays populated.

- **Leaderboard approach**: `getLeaderboard()` uses MongoDB aggregation pipeline to group activities by team, sum points, lookup team names, sort descending by points, and assign 1-based ranks.

- **Workout suggestions approach**: `suggestWorkouts(userEmail)` finds user by email (404 if not found), determines focus from user's fitnessGoal, queries workouts matching that focus, adds reason explaining the match (e.g., "matches your strength goal"), returns first matching workout.

## Test plan

Record the commands you run and what each failure means.

**Phase 1: Data Tier Validation (✅ COMPLETE)**
- Command: `npm run test:data --prefix octofit-tracker/backend`
- Result: All 5 tests passing
  - ✅ User: validates name, email, fitnessGoal required
  - ✅ Team: validates name, mascot required; members defaults to []
  - ✅ Activity: validates all 6 fields required
  - ✅ Workout: validates focus, minutes, difficulty required
  - ✅ Seed: creates demo data idempotently

**Phase 2: Activity Service (✅ COMPLETE)**
- Command: `npm run test:api --prefix octofit-tracker/backend`
- Initial failures: 4 tests failed (501 from stub, empty leaderboard, missing reason)
- After createActivity(): 1 passed (activities create & list)
- Result: Activities API test passing; validates inputs, checks references, computes points

**Phase 3: Team Service (✅ COMPLETE)**
- Implemented createTeam() with name/mascot validation
- Result: 2 of 4 API tests passing; teams create & list working

**Phase 4: Leaderboard Service (✅ COMPLETE)**
- Implemented getLeaderboard() with MongoDB aggregation
- Result: 3 of 4 API tests passing; leaderboard orders teams by total points

**Phase 5: Workout Suggestions (IN PROGRESS)**
- Next: Implement suggestWorkouts() to filter by user goal and add reason
- Expected: All 4 API tests will pass

**Phase 6: React Components (PENDING)**
- Command: `npm test --prefix octofit-tracker/frontend`
- Plan: Implement Activities, Teams, Leaderboard, Workouts components with fetch, loading/error/empty/success states

**Build validation (PENDING)**
- Backend build: `npm run build --prefix octofit-tracker/backend`
- Frontend build: `npm run build --prefix octofit-tracker/frontend`
