# gym_web

Simple gym activity app using Next.js + DynamoDB.

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
```

## Setup

```bash
cp .env.example .env.local
npm install
```

## Create DynamoDB Table

```bash
npm run create-table
```

## Import Existing Notes (`gym.txt`)

```bash
npm run import-gym
```

This parses your `gym.txt` and stores sessions in DynamoDB (`GymSessions`).
Duplicate same-day entries are merged into one session (with combined exercises).
For scripts, set min date in shell before import:

```bash
export IMPORT_MIN_DATE=2025-06-01
```

## See Current Sessions In Terminal

```bash
LIMIT=30 npm run list-sessions
```

## Re-import Cleanly (if old import had bad years)

```bash
npm run clear-sessions
npm run import-gym
```

## Run Web App

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Public Deployment (AWS via SST)

```bash
export AWS_PROFILE=AdministratorAccess-084375563972
export AWS_REGION=us-east-2
npm install
npm run deploy
```

`sst deploy` outputs the public site URL and managed DynamoDB table name.

## App Features (MVP)

- View sessions ordered by date
- Add a new session with date and exercises
- Data is stored in DynamoDB under `userId=me`
