# LoopChat Frontend

LoopChat is a Next.js app for AI-powered patient engagement.
It lets a clinic ingest its public website content, answer patient questions in chat, and collect lead details when patients request appointments or follow-up.

## Features

- Website ingestion from a clinic URL using Firecrawl
- Context chunking and embeddings for retrieval
- Chat assistant powered by DashScope-compatible OpenAI API
- Intent-driven intake form trigger from assistant responses
- Lead capture and persistence with Drizzle + Neon/Postgres
- Embeddable chat launcher script for third-party websites

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- LangChain
- OpenAI SDK (DashScope-compatible endpoint)
- Firecrawl
- Drizzle ORM with Neon serverless Postgres
- Jest

## Project Flow

1. A clinic URL is submitted in the app.
2. The backend crawls the site and converts content into markdown.
3. Content is split into chunks and embedded into an in-memory vector store.
4. Chat requests include clinic context so answers are clinic-specific.
5. If the assistant includes the trigger token SHOW_INTAKE_FORM, the UI opens intake.
6. Intake submission stores lead data in Postgres.

## Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- pnpm (recommended), npm, yarn, or bun
- A Postgres database URL (Neon works well)

## Environment Variables

Create `.env.local` with:

```env
DASHSCOPE_API_KEY=your_dashscope_key
FIRECRAWL_API_KEY=your_firecrawl_key
DATABASE_URL=your_postgres_connection_string
SANDBOX_PROVIDER=alibaba
```

Notes:
- DASHSCOPE_API_KEY is used for chat and embeddings.
- FIRECRAWL_API_KEY is used for website crawling.
- DATABASE_URL is used for lead storage through Drizzle.
- SANDBOX_PROVIDER selects sandbox implementation. Use `alibaba` (default) or `local`.

## Install and Run

Install dependencies:

```bash
pnpm install
```

Start development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Start production server:

```bash
pnpm start
```

Run tests:

```bash
pnpm test
```

Run lint:

```bash
pnpm lint
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### `POST /api/ingest`
- Body: `url`
- Action: Crawls site, chunks content, creates embeddings, stores vector data in memory
- Response: success flag, chunk count, and top context text

### `POST /api/search`
- Body: `query`
- Action: Similarity search against in-memory vector store
- Response: context text from top matches

### `POST /api/chat`
- Body: `conversation_id`, `message`, `clinicContext`
- Action: Sends chat history to model and returns assistant reply
- Response: `reply` and `showIntakeForm` boolean

### `POST /api/leads`
- Body: `name`, `email`, `phone`, `reason`, `insurance`, `clinicUrl`, `transcript`
- Action: Validates and stores intake lead in database
- Response: success flag and saved lead

### `POST /api/copilotkit`
- Action: CopilotKit runtime endpoint using DashScope-compatible adapter

## Database

Current schema stores leads with:
- name, email, phone
- reason, insurance
- clinicUrl, transcript
- createdAt

If you manage migrations with Drizzle, ensure your database schema is created before testing lead submission.

## Embedding the Widget

An embeddable loader script is available under `public/embed`.
It creates a floating Chat button and toggles an iframe chat panel.

Before production:
- Update the iframe source URL to your deployed frontend domain
- Pass client_id from the host site script tag as needed

## Testing

Current tests include smoke coverage for:
- chat response shape
- intake trigger token handling
- basic ingestion URL validation
- intake required field validation

Recommended next tests:
- API route integration tests for chat, ingest, and leads
- Error-path tests for missing environment variables
- Database write/read integration tests

## Known Limitations

- Conversation history is stored in process memory (not durable).
- Vector store is in memory (resets on restart/deploy).
- In-memory approach is suitable for demos/hackathons, not production scale.

## Production Hardening Suggestions

- Replace in-memory vector store with a persistent vector database.
- Persist conversations in a durable store.
- Add auth, rate limiting, and abuse protection for public endpoints.
- Add structured logging and monitoring.
- Add validation schemas and stronger input sanitization across endpoints.

## License

Private/internal project unless otherwise specified.
