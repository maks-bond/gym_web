# gym_web

Simple gym activity app using Next.js + DynamoDB, deployed with SST.

## Website

- Name: `Gym Log`
- Public URL: `https://del583hszwti1.cloudfront.net`
- AWS Region: `us-east-2`

## AWS Profile

This project uses:

- `AdministratorAccess-084375563972`

## Login To AWS Locally

```bash
aws sso login --profile AdministratorAccess-084375563972
aws sts get-caller-identity --profile AdministratorAccess-084375563972
export AWS_PROFILE=AdministratorAccess-084375563972
export AWS_REGION=us-east-2
```

## Setup

```bash
cp .env.example .env.local
npm install
```

## Deploy

```bash
npm run deploy
```

SST outputs:

- `url`
- `sessionsV1TableName`
- `sessionsTableName`
- `exercisesTableName`
- `locationsTableName`

## Data Model

- Legacy backup table: `sessionsV1` (`DDB_TABLE_SESSIONS_V1`)
- Normalized sessions table: `sessionsV2` (`DDB_TABLE_SESSIONS`)
- Exercise catalog table: `DDB_TABLE_EXERCISES`
- Locations table: `DDB_TABLE_LOCATIONS`

## Normalization / Migration Flow

1. Seed locations:

```bash
npm run seed-locations
```

2. Generate exercise review report (for duplicate review):

```bash
npm run review-exercises
```

This writes `data/exercise-review.json`.

3. Migrate legacy sessions to normalized schema:

```bash
npm run migrate-v1-to-v2
```

4. Verify normalized sessions:

```bash
LIMIT=40 npm run list-sessions
```

## Legacy Utilities

- List legacy sessions: `npm run list-sessions-v1`
- Clear legacy sessions: `npm run clear-sessions`
- Import `gym.txt` into legacy table: `npm run import-gym`

## Run Web App Locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

## API Endpoints

- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/exercises?q=...&limit=...`
- `POST /api/exercises`
- `GET /api/locations`

## Hidden Exercise Create Page

- Route: `/exercises/new`
- Not linked in top navigation by design.
