# LoopChat

> AI-powered patient engagement for healthcare clinics — built on Alibaba Cloud FC Sandbox, Qwen, and Next.js.

LoopChat lets a clinic ingest its public website, answer patient questions in real-time chat, capture structured intake data, and automatically follow up by email — turning anonymous website visits into qualified, booked appointments.

The core technical innovation is a **long-running prior authorization workflow** powered by **Alibaba Cloud FC Sandbox deep hibernation**: the AI agent executes the intake, submits the insurance request, hibernates (billing drops to $0 while waiting), and resumes automatically when the webhook arrives — restoring full state in under 1 second.

---

## Demo

**Live URL:** https://frontend-three-beryl-17.vercel.app

**Full loop:**
```
Patient chats → RAG answers from clinic site →
Booking intent detected → Intake form →
Lead saved to NeonDB → Follow-up email sent →
Insurance request submitted → FC Sandbox HIBERNATES ($0 compute) →
Webhook fires → Sandbox RESUMES → Appointment confirmed → Email sent
```

---

## Features

- **Website ingestion** — paste any clinic URL, system crawls and indexes it in under 60 seconds
- **RAG-powered chat** — answers grounded in real clinic content, not generic knowledge
- **Intent detection** — AI automatically surfaces intake form when patient shows booking interest
- **Structured intake** — collects name, email, phone, insurance, reason for visit
- **NeonDB lead persistence** — every intake saved to Postgres with full validation
- **Personalized follow-up email** — Qwen generates a patient-specific email, Resend delivers it
- **FC Sandbox hibernation** — insurance wait triggers deep hibernation, billing drops to $0
- **Webhook resume** — sandbox wakes in <1s when insurance responds, state fully restored
- **WCAG 2.1 AA** — accessible chat interface with aria-labels throughout
- **STANDARDS.md** — full OWASP, HIPAA, and accessibility compliance documentation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| LLM | Qwen-plus via DashScope (Alibaba Cloud) |
| Embeddings | DashScope text-embedding-v3 |
| Web crawler | Firecrawl |
| Vector store | LangChain MemoryVectorStore |
| Database | NeonDB (Postgres) via Drizzle ORM |
| Email | Resend |
| Sandbox (dev) | LocalSandbox — in-memory mock with checkpoint |
| Sandbox (prod) | AlibabaSandbox — E2B SDK → Alibaba Cloud FC Sandbox |
| Observability | Alibaba Cloud SLS (x-sls-trace-id) |
| Deployment | Vercel |
| Testing | Jest + ts-jest |

---

## Project Flow

1. Clinic pastes their website URL into the dashboard
2. Backend crawls the site via Firecrawl → splits into chunks → embeds via DashScope
3. Patient opens chat widget and asks questions — RAG answers from clinic content
4. AI detects booking intent → intake form surfaces mid-conversation
5. Patient submits intake → lead saved to NeonDB → personalized email sent via Resend
6. Patient clicks "Submit Insurance Request"
7. FC Sandbox created → workflow checkpoint saved → sandbox enters **Deep Hibernation** (billing $0)
8. Insurance webhook arrives → sandbox **resumes in <1s** → checkpoint restored
9. Appointment confirmation generated → confirmation email sent → sandbox destroyed

---

## Architecture

```
Browser
  ↓
Next.js + ChatWidget
  ↓
Next.js API Routes (/api/chat, /api/ingest, /api/leads, /api/email)
  ↓
  ├── DashScope (Qwen-plus LLM + text-embedding-v3)
  ├── Firecrawl (website ingestion)
  ├── NeonDB (lead persistence)
  ├── Resend (email delivery)
  └── SandboxService
        ├── LocalSandbox (development mock)
        └── AlibabaSandbox (production)
              ↓
        Alibaba Cloud FC Sandbox
              ↓
        Execute → Hibernate → Wake → Resume
```

---

## Repository Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # DashScope chat + intent detection
│   │   ├── ingest/route.ts        # Firecrawl + embeddings
│   │   ├── search/route.ts        # Vector similarity search
│   │   ├── leads/route.ts         # NeonDB lead persistence
│   │   ├── email/route.ts         # Qwen email generation + Resend
│   │   ├── health/route.ts        # Health check endpoint
│   │   ├── insurance/
│   │   │   └── request/route.ts   # FC Sandbox create + hibernate
│   │   └── webhook/route.ts       # FC Sandbox resume + confirmation
│   ├── page.tsx                   # Main page
│   └── layout.tsx                 # Root layout
├── components/
│   ├── ChatWidget.tsx             # Custom chat UI with hibernation states
│   └── IntakeForm.tsx             # Patient intake form modal
├── backend/
│   └── services/
│       ├── SandboxService.ts      # Abstract interface
│       ├── LocalSandbox.ts        # Local mock implementation
│       └── AlibabaSandbox.ts      # Alibaba Cloud FC Sandbox via E2B SDK
├── lib/
│   └── db/
│       ├── index.ts               # Drizzle client
│       └── schema.ts              # NeonDB schema (leads table)
├── __tests__/
│   └── chat.test.ts               # Jest unit tests (8 passing)
├── STANDARDS.md                   # WCAG, OWASP, HIPAA compliance docs
└── drizzle.config.ts              # Drizzle migration config
```

---

## Prerequisites

- Node.js 18+ (Node.js 20 recommended)
- pnpm 10+
- NeonDB account (or any Postgres database)
- Alibaba Cloud account with Function Compute permissions

---

## Environment Variables

Create `.env.local` with:

```env
# Alibaba Cloud DashScope — LLM and embeddings
DASHSCOPE_API_KEY=your_dashscope_key

# Firecrawl — website crawling
FIRECRAWL_API_KEY=your_firecrawl_key

# NeonDB — lead persistence
DATABASE_URL=your_postgres_connection_string

# Resend — email delivery
RESEND_API_KEY=your_resend_key

# Alibaba Cloud FC Sandbox — hibernation
E2B_API_KEY=your_fc_sandbox_api_key
E2B_API_URL=https://api.cn-beijing.e2b.fc.aliyuncs.com
E2B_DOMAIN=cn-beijing.e2b.fc.aliyuncs.com

# Sandbox provider: 'alibaba' or 'local'
SANDBOX_PROVIDER=local
```

---

## Install and Run

Install dependencies:

```bash
pnpm install
```

Push database schema:

```bash
pnpm drizzle-kit push
```

Start development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

Build for production:

```bash
pnpm build
pnpm start
```

Run tests:

```bash
pnpm test
```

Verify FC Sandbox credentials:

```bash
npx tsx quickstart.ts
```

If you see `✅ Sandbox created: sbx-xxxx` and `FC Sandbox is working!` your Alibaba Cloud FC Sandbox credentials are correctly configured. If not, check your `E2B_API_KEY`, `E2B_API_URL`, and `E2B_DOMAIN` values in `.env.local`.

---

## API Endpoints

### `GET /api/health`
Returns service status, version, environment, and sandbox provider.

### `POST /api/ingest`
```json
{ "url": "https://yourclinic.com" }
```
Crawls site, chunks content, embeds via DashScope, returns top context chunks.

### `POST /api/search`
```json
{ "query": "do you accept Blue Cross?" }
```
Similarity search against in-memory vector store.

### `POST /api/chat`
```json
{
  "conversation_id": "uuid",
  "message": "I'd like to book an appointment",
  "clinicContext": "..."
}
```
Returns `reply` string and `showIntakeForm` boolean.

### `POST /api/leads`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-1234",
  "reason": "Knee pain",
  "insurance": "Blue Cross",
  "clinicUrl": "https://yourclinic.com"
}
```
Validates and saves lead to NeonDB.

### `POST /api/email`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "reason": "Knee pain",
  "insurance": "Blue Cross",
  "clinicUrl": "https://yourclinic.com"
}
```
Qwen generates personalized email, Resend delivers it.

### `POST /api/insurance/request`
```json
{
  "patientId": "jane@example.com",
  "insurance": "Blue Cross",
  "doctorId": "DR-402",
  "appointmentDate": "2026-08-12",
  "procedureCode": "99203"
}
```
Creates FC Sandbox, saves checkpoint, triggers Deep Hibernation.
Returns `sandboxId` and `status: "HIBERNATING"`.

### `POST /api/webhook`
```json
{
  "sandboxId": "local-sbx-xxx",
  "requestId": "pa-xxx",
  "patientId": "jane@example.com",
  "status": "APPROVED",
  "authorizationNumber": "AUTH-789012"
}
```
Resumes sandbox, restores checkpoint, generates appointment, sends confirmation email.

---

## Sandbox Architecture

The sandbox layer uses a clean interface pattern — swap implementations without changing any business logic:

```typescript
// Development — no Alibaba Cloud needed
import { LocalSandbox } from "../backend/services/LocalSandbox";
const sandboxService = new LocalSandbox();

// Production — real FC Sandbox hibernation
import { AlibabaSandbox } from "../backend/services/AlibabaSandbox";
const sandboxService = new AlibabaSandbox();
```

Both implement the same `SandboxService` interface:
```typescript
interface SandboxService {
  create(patientId: string): Promise<SandboxState>;
  pause(sandboxId: string, checkpoint: Record<string, unknown>): Promise<SandboxState>;
  resume(sandboxId: string): Promise<SandboxState>;
  destroy(sandboxId: string): Promise<void>;
}
```

---

## Database Schema

```typescript
// lib/db/schema.ts
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  reason: text("reason").notNull(),
  insurance: varchar("insurance", { length: 255 }),
  clinicUrl: varchar("clinic_url", { length: 500 }),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Testing

```bash
pnpm test
```

Current test suite (8 passing):
- Chat response shape validation
- Intake form trigger token detection
- Intake form field validation
- URL ingestion validation

---

## Standards & Compliance

See [STANDARDS.md](./STANDARDS.md) for full documentation covering:

- **WCAG 2.1 AA** — accessibility compliance
- **OWASP Top 10** — web security practices
- **OWASP LLM Top 10** — AI-specific security
- **HIPAA considerations** — healthcare data privacy
- **FC Sandbox security** — MicroVM isolation, SLS observability

---

## Known Limitations

- Vector store is in-memory — resets on restart. Replace with AnalyticDB or Qdrant for production.
- Conversation history is in-memory — not durable across restarts.
- FC Sandbox `pauseSession` pending enablement on Alibaba Cloud account — currently using `LocalSandbox` mock. `AlibabaSandbox` integration is complete and verified (real `sbx-` IDs confirmed). Swap is 2 lines of code once enabled.
- No authentication yet — planned for v1.0.

---

## Production Hardening Roadmap

- Replace MemoryVectorStore with Alibaba Cloud AnalyticDB
- Persist conversation history in NeonDB
- Authentication and clinic admin dashboard
- Rate limiting on all public API endpoints
- CAPTCHA on intake form
- Full HIPAA compliance audit + BAA agreements
- Dependency vulnerability audit

---

## Team

**Nirvaan Labs**

- Cheryl — AI Engineer, full-stack developer, founder
- Don T. — Software Engineer

---

## License

Private — Nirvaan Labs · AI Agent Builder Challenge 2026