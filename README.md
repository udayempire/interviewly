# Interviewly

AI-powered mock interview platform. Practice technical interviews with real-time AI feedback, voice interaction, and code editing — all in your browser.

## Tech Stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Monorepo    | Turborepo + Bun workspaces                    |
| Frontend    | Next.js 16, React 19, Tailwind CSS 4, shadcn  |
| Backend     | Express 5, Bun runtime, WebSockets            |
| Database    | PostgreSQL, Prisma 7 ORM                      |
| AI / LLM    | Gemini, Groq, Deepgram (STT/TTS)              |
| Auth        | JWT, Google OAuth, GitHub OAuth                |

## Project Structure

```
interviewlyy/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   ├── backend/      # Express API server (port 4000)
│   └── docs/         # Documentation site
├── packages/
│   ├── database/     # Prisma schema, migrations, DB client (@repo/db)
│   ├── llm/          # LLM provider abstraction (@repo/llm)
│   ├── types/        # Shared TypeScript types (@repo/types)
│   ├── ui/           # Shared React component library (@repo/ui)
│   ├── eslint-config/
│   └── typescript-config/
```

## Prerequisites

- [Bun](https://bun.sh) (v1.3.14+)
- [Node.js](https://nodejs.org) (v18+)
- [Docker](https://www.docker.com/) & Docker Compose (for local PostgreSQL)
- A [Neon](https://neon.tech) database **or** a local PostgreSQL instance

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/udayempire/interviewly.git
cd interviewly
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up the database

**Option A — Local PostgreSQL via Docker:**

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- User: `postgres`
- Password: `password`
- Database: `interviewly`

Your `DATABASE_URL` would be:

```
postgresql://postgres:password@localhost:5432/interviewly
```

**Option B — Neon (or any remote PostgreSQL):**

Create a database on [Neon](https://neon.tech) and grab your connection string.

### 4. Configure environment variables

Create `.env` files in the locations below. Use the `.env.example` files as reference if available, or follow the templates here.

#### Root `.env`

```bash
# interviewlyy/.env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>"
```

#### Backend `.env`

```bash
# apps/backend/.env
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>"

# LLM Providers (at least one required)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
LLM_PROVIDER=gemini
DEFAULT_LLM_PROVIDER=groq
DEFAULT_STT_PROVIDER=groq
DEFAULT_TTS_PROVIDER=deepgram

# Auth
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_base64_encryption_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_SECRET=your_google_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:4000/api/v1/auth/github/callback
GITHUB_TOKEN=your_github_pat

FRONTEND_URL=http://localhost:3000
```

#### Web `.env`

```bash
# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_API_VERSION=api/v1
```

### 5. Generate the Prisma client & run migrations

```bash
cd packages/database
bun run db:generate
bun run db:migrate
cd ../..
```

### 6. Start the development servers

```bash
bun run dev
```

This runs all apps in parallel via Turborepo:

- **Web** → [http://localhost:3000](http://localhost:3000)
- **Backend** → [http://localhost:4000](http://localhost:4000)

To run a specific app:

```bash
# Frontend only
bun run dev --filter=web

# Backend only
bun run dev --filter=backend
```

## Available Scripts

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `bun run dev`          | Start all apps in development mode         |
| `bun run build`        | Build all apps and packages                |
| `bun run lint`         | Lint all packages                          |
| `bun run format`       | Format code with Prettier                  |
| `bun run check-types`  | Run TypeScript type checking               |

### Database scripts (run from `packages/database/`)

| Command                | Description                                |
| ---------------------- | ------------------------------------------ |
| `bun run db:generate`  | Generate Prisma client                     |
| `bun run db:migrate`   | Create and apply migrations                |
| `bun run db:deploy`    | Apply pending migrations (production)      |

## Contributing

Contributions are welcome! Here's how to get started:

### 1. Fork the repository

Click the **Fork** button at the top-right of the [repo page](https://github.com/udayempire/interviewly).

### 2. Create a feature branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make your changes

- Follow the existing code style and conventions
- Write meaningful commit messages
- Keep PRs focused — one feature or fix per PR

### 4. Test your changes

```bash
bun run build        # Make sure everything compiles
bun run lint         # No lint errors
bun run check-types  # No type errors
```

### 5. Push and open a pull request

```bash
git push origin feature/your-feature-name
```

Then open a PR against the `main` branch with a clear description of what you changed and why.

### Contribution Guidelines

- **Branch naming**: `feature/`, `fix/`, `docs/`, `refactor/` prefixes
- **Commits**: Use clear, descriptive commit messages
- **Code style**: Run `bun run format` before committing
- **Types**: Shared types go in `packages/types`
- **Components**: Shared UI components go in `packages/ui`
- **Database changes**: Add Prisma migrations via `bun run db:migrate` in `packages/database`
- **No secrets**: Never commit API keys, tokens, or `.env` files

## License

This project is open source. See the [LICENSE](LICENSE) file for details.
