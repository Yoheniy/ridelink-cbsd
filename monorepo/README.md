# RideLink CBSD — JS/TS Monorepo

This folder is a **workspace-style monorepo** (npm workspaces) created for the CBSD “Monorepo System Development” guideline.

## Structure

```
monorepo/
  packages/
    ui-components/   # Reusable UI components (React + Tailwind + shadcn-style)
    utils/           # Shared utilities (date, string, request helpers, etc.)
    feature-x/       # Feature package 1 (uses ui-components + utils)
    feature-y/       # Feature package 2 (uses ui-components + utils)
  apps/
    feature-x-app/   # System assembly app for feature-x (composition only)
    feature-y-app/   # System assembly app for feature-y (composition only)
```

## Setup

From this folder:

```bash
npm install
```

## Run (dev)

```bash
npm run dev
```

Run the other system app:

```bash
npm run dev:y
```

## Build all packages/apps

```bash
npm run build
```

