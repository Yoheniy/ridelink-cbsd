# RideLink Backend

A real-time ride-sharing backend built with Express.js, Better Auth, Convex, and Prisma.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (for local development) - [Download here](https://www.postgresql.org/download/)
- **pnpm** package manager (recommended) - `npm install -g pnpm`

## Quick Setup Overview

1. **Clone and install dependencies**
2. **Set up environment variables**
3. **Set up PostgreSQL database**
4. **Run Prisma migrations**
5. **Set up Convex local development**
6. **Start development servers**

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ridelink/backend
pnpm install
```

### 2. Environment Setup

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-32-character-random-string
BETTER_AUTH_URL=http://localhost:5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Database Configuration (local PostgreSQL recommended for development)
DATABASE_URL=postgresql://username:password@localhost:5432/ridelink_dev

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key

# Convex Configuration
CONVEX_SITE_URL=http://localhost:3211  # Local Convex URL (will be set automatically)
CONVEX_INTERNAL_API_KEY=your-32-plus-character-random-string
```

**Important:** Convex uses `.env.local` by default for its environment variables. After Convex generates the `.env.local` file during setup, you must copy the Convex-related variables (`CONVEX_SITE_URL`, `BETTER_AUTH_URL`) to your `.env` file so that your Express app can use them.

**Note:** Generate secure random strings for `BETTER_AUTH_SECRET` and `CONVEX_INTERNAL_API_KEY`. You can use `openssl rand -hex 32` or an online generator.

### 3. Database Setup

#### Option A: Local PostgreSQL (Recommended for Development)

1. **Install PostgreSQL** if not already installed
2. **Create a database:**
   ```sql
   CREATE DATABASE ridelink_dev;
   ```
3. **Update `DATABASE_URL`** in your `.env` file with your PostgreSQL connection string

#### Option B: Neon Database (Cloud)

1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` as `DATABASE_URL`

### 4. Prisma Setup

Generate Prisma client and run initial migration:

```bash
# Generate Prisma client
pnpm run db:generate

# Push schema to database (creates tables)
pnpm run db:push

# (Optional) Open Prisma Studio to view database
pnpm run db:studio
```

### 5. Convex Local Development Setup

For local development, we'll use Convex's local deployment instead of the cloud deployment. This eliminates the need for ngrok and makes setup much simpler.

1. **Install Convex CLI** (if not already installed):

   ```bash
   npm install -g convex
   ```

2. **Initialize Convex local development:**

   ```bash
   npx convex dev --local
   ```

   This will:
   - Create a `.env.local` file with Convex environment variables
   - Start the local Convex server on `http://localhost:3211`
   - Watch for changes and automatically reload

3. **Copy environment variables:**
   After running the above command, Convex will create/update `.env.local`. Copy the `CONVEX_SITE_URL` value to your `.env` file:

   ```env
   CONVEX_SITE_URL=http://localhost:3211
   ```

4. **Set up Better Auth connection:**
   In your `.env.local` file (created by Convex), ensure these variables are set:

   ```env
   BETTER_AUTH_URL=http://localhost:5000
   CONVEX_INTERNAL_API_KEY=your-32-plus-character-random-string
   ```

   The `CONVEX_INTERNAL_API_KEY` should match the value in your `.env` file.

### 6. Better Auth ↔ Convex Connection

With local Convex deployment, the connection is much simpler since both services run locally and can communicate directly.

Convex will automatically verify JWTs issued by Better Auth using the JWKS endpoint at `http://localhost:5000/api/auth/jwks`. No additional configuration is needed beyond setting the environment variables as described above.

### 7. Start Development Servers

You now have two processes to run:

**Terminal 1: Backend Server**

```bash
pnpm run dev
```

**Terminal 2: Convex Local Development**

```bash
npx convex dev --local
```

That's it! Both services will run locally and communicate directly.

## Verification

1. **Backend Health Check:**
   Visit `http://localhost:5000/api/health` (if you have a health endpoint) or check the console logs.

2. **Database Connection:**

   ```bash
   pnpm run db:studio
   ```

   This should open Prisma Studio showing your database tables.

3. **Convex Connection:**
   Check that Convex is running on `http://localhost:3211` and shows your functions in the terminal.

4. **Authentication Test:**
   Try accessing a protected Convex function to ensure JWT verification works.

5. **Integration Test:**
   Run the JWT integration test to verify Better Auth ↔ Convex authentication:
   ```bash
   pnpm run test auth-convex.integration.spec.ts
   ```
   This test requires both the Express server and Convex to be running.

## Available Scripts

```bash
# Development
pnpm run dev              # Start backend development server
pnpm run convex:dev       # Start Convex local development server

# Database
pnpm run db:push          # Push schema changes to database
pnpm run db:generate      # Generate Prisma client
pnpm run db:migrate       # Run database migrations
pnpm run db:studio        # Open Prisma Studio
pnpm run db:seed          # Seed database with test data
pnpm run db:reset         # Reset database

# Build & Deploy
pnpm run build            # Build for production
pnpm run start            # Start production server
pnpm run convex:deploy    # Deploy Convex functions to cloud

# Testing
pnpm run test             # Run tests
pnpm run test:watch       # Run tests in watch mode
```

## Troubleshooting

### Common Issues

1. **Convex can't connect to Better Auth:**
   - Ensure both services are running (backend on port 5000, Convex on port 3211)
   - Check that `BETTER_AUTH_URL` is set to `http://localhost:5000` in `.env.local`
   - Verify the JWKS endpoint is accessible: `http://localhost:5000/api/auth/jwks`

2. **Database connection issues:**
   - Ensure PostgreSQL is running
   - Check your `DATABASE_URL` format
   - For local PostgreSQL, make sure the database exists

3. **Authentication not working:**
   - Verify `BETTER_AUTH_SECRET` is set correctly
   - Check that `BETTER_AUTH_URL` is set to `http://localhost:5000` in both `.env` and `.env.local`

4. **Convex not starting:**
   - Make sure no other service is using port 3210
   - Try `npx convex dev --local --port 3210` if port 3210 is busy

### Environment Variable Confusion

- **Express app** uses `.env` file
- **Convex** uses `.env.local` file
- After Convex creates `.env.local`, copy `CONVEX_SITE_URL` to your `.env` file
- Keep `BETTER_AUTH_URL=http://localhost:5000` in both files

### Getting Help

- Check the [Convex Documentation](https://docs.convex.dev)
- Review [Better Auth Documentation](https://better-auth.com)
- Check existing issues in the project repository

## Architecture Overview

- **Express.js**: REST API server running on `http://localhost:5000`
- **Better Auth**: Authentication with JWT tokens
- **Convex**: Real-time backend running locally on `http://localhost:3211`
- **Prisma**: Database ORM with PostgreSQL
- **JWT + JWKS**: Secure token verification between services

The authentication flow (local development):

1. Client authenticates with Express (Better Auth)
2. Better Auth issues JWT tokens
3. Client passes JWT to Convex
4. Convex verifies JWT using JWKS from `http://localhost:5000/api/auth/jwks`

**For Production:**

- Deploy Convex to the cloud using `npx convex deploy`
- Update `CONVEX_SITE_URL` in production environment
- Set `BETTER_AUTH_URL` to your production backend URL
