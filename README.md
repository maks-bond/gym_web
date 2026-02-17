# gym_web

Gym tracker web app (`Maksym Gym`) built with Next.js + DynamoDB and deployed with SST on AWS.

## Live App

- Website name: `Maksym Gym`
- Public URL: `https://gym-maksym.pages.dev/`
- Origin URL (AWS): `https://del583hszwti1.cloudfront.net`
- AWS region: `us-east-2`
- Stage: `maksym`

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 (global CSS plus utility import)
- AWS DynamoDB
- SST (infrastructure and deployment)

## AWS Access (Local)

Profile in use:

- `AdministratorAccess-084375563972`

Login and environment setup:

```bash
aws sso login --profile AdministratorAccess-084375563972
aws sts get-caller-identity --profile AdministratorAccess-084375563972
export AWS_PROFILE=AdministratorAccess-084375563972
export AWS_REGION=us-east-2
```

## Local Development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy

```bash
npm run deploy
```

Important SST outputs:

- `url`
- `sessionsV1TableName`
- `sessionsTableName`
- `exercisesTableName`
- `locationsTableName`
- `backupsTableName`

## Data Model (DynamoDB)

- Legacy sessions table (`DDB_TABLE_SESSIONS_V1`)
  - PK: `userId` (string), SK: `sessionDate` (YYYY-MM-DD)
  - Stores imported/legacy exercise strings
- Normalized sessions table (`DDB_TABLE_SESSIONS`, v3)
  - PK: `userId`, SK: `sessionId`
  - Stores `sessionDate`, optional `startTime`/`endTime`, `locationId`, and `exerciseItems[]`
- Previous normalized sessions table (`DDB_TABLE_SESSIONS_V2`, legacy)
  - PK: `userId`, SK: `sessionDate`
  - Kept for migration/reference
- Exercises table (`DDB_TABLE_EXERCISES`)
  - PK: `exerciseId`
  - Stores canonical exercise catalog (`name`, `aliases`, usage/order metadata)
- Locations table (`DDB_TABLE_LOCATIONS`)
  - PK: `locationId`
  - Stores location catalog
- Backups table (`DDB_TABLE_BACKUPS`)
  - PK: `userId`, SK: `backupId` (ISO timestamp)
  - Stores snapshot payload + summary counts

## Routes (Web)

- `/` sessions list + monthly training calendar + session edit links
- `/new` create a new session
- `/sessions/[sessionId]/edit` edit an existing session
- `/exercises` list and edit exercise catalog
- `/exercises/new` hidden page to create a new exercise

## Routes (API)

- `GET /api/sessions`
  - list all normalized sessions
- `GET /api/sessions?sessionDate=YYYY-MM-DD`
  - get one session
- `GET /api/sessions?sessionId=<id>`
  - get one session by id
- `POST /api/sessions`
  - create session (supports optional `startTime`/`endTime` in `HH:mm`)
- `PUT /api/sessions`
  - update session (pass `sessionId`; supports `startTime`/`endTime`)
- `GET /api/exercises?q=...&limit=...`
  - list exercises (supports text filter)
- `POST /api/exercises`
  - create exercise
- `PUT /api/exercises`
  - edit exercise
- `GET /api/locations`
  - list locations
- `POST /api/backup`
  - create full backup snapshot (sessions v1/v2 + exercises + locations)
- `GET /api/backup`
  - list backup metadata
- `GET /api/backup?backupId=<ISO timestamp>`
  - fetch one backup snapshot

Current app is single-user by default:

- `USER_ID = "me"` in API routes and scripts.

## Backup Workflow

Create backup:

```bash
curl -X POST https://del583hszwti1.cloudfront.net/api/backup
```

List backups:

```bash
curl https://del583hszwti1.cloudfront.net/api/backup
```

Get one backup:

```bash
curl "https://del583hszwti1.cloudfront.net/api/backup?backupId=2026-02-16T12:34:56.000Z"
```

CLI shortcuts (local):

```bash
npm run backup-now
npm run list-backups
```

## Import / Migration Flow

Legacy import (`gym.txt` -> sessions v1):

```bash
npm run import-gym
```

Normalize into v2:

```bash
npm run seed-locations
npm run review-exercises
npm run migrate-v1-to-v2
export DDB_TABLE_SESSIONS_V2=<old sessions table>
export DDB_TABLE_SESSIONS=<new sessions table>
npm run migrate-sessions-v2-to-v3
npm run rank-exercises
LIMIT=40 npm run list-sessions
```

`npm run review-exercises` writes dedupe candidates to `data/exercise-review.json`.

## Useful Scripts

- `npm run list-sessions` list normalized sessions
- `npm run list-sessions-v1` list legacy sessions
- `npm run clear-sessions-v2` clear normalized sessions
- `npm run clear-sessions` clear legacy sessions
- `npm run clear-exercises` clear exercise catalog
- `npm run seed-locations` seed locations table
- `npm run migrate-sessions-v2-to-v3` copy old normalized sessions into v3 schema

## Time Fields

- Session schema now supports optional:
  - `startTime` (`HH:mm`)
  - `endTime` (`HH:mm`)
- UI input for these can be added later; API and DB schema are ready.
- `npm run deploy` deploy/update AWS resources
- `npm run remove` remove stage resources (non-production stages are configured as removable)

## Resume Development Checklist

When returning later:

1. Run AWS login and export `AWS_PROFILE` + `AWS_REGION`.
2. `npm install`
3. `npm run dev` for local work, or `npm run deploy` for cloud updates.
4. Verify table names from latest deploy output.
5. Run `npm run backup-now` before major data/schema changes.

## Cloudflare Pages Redirect (Free URL)

This repo includes a ready redirect site in `pages-redirect/` for a free `*.pages.dev` URL.

- Source folder: `pages-redirect`
- Redirect target: `https://del583hszwti1.cloudfront.net`
- Rule file: `pages-redirect/_redirects`
- Active Pages URL: `https://gym-maksym.pages.dev/`
- Note: this app is connected to your Cloudflare account via a Pages project.
- To rename the public `*.pages.dev` URL, go to Cloudflare Dashboard -> Workers & Pages -> your project -> Settings -> General -> Project name / Domains.

Quick setup in Cloudflare:

1. Cloudflare Dashboard -> Pages -> Create project.
2. Choose `Direct Upload` (or connect this repo).
3. Upload contents of `pages-redirect/`.
4. Pick your subdomain, for example `maksym-gym.pages.dev`.
5. Deploy.

After deploy, all paths are redirected to the current app URL using a `302` redirect.
