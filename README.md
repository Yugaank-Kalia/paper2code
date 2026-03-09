# paper-to-code

Turn academic papers into working PyTorch implementations. Upload a PDF, TXT, or Markdown paper, and the app extracts the core algorithms, model architecture, and training procedures using RAG + LLM, then generates annotated, runnable code blocks.

## How it works

1. **Upload** — A paper (PDF / TXT / MD) is uploaded and stored in Supabase Storage.
2. **Chunk & Embed** — The raw text is split into overlapping chunks and embedded with a Hugging Face sentence-transformer model.
3. **Retrieve** — At generation time, the most relevant chunks are retrieved via cosine similarity against a fixed implementation-focused query.
4. **Generate** — The retrieved context is fed to a local [Ollama](https://ollama.com) model, which returns structured JSON code blocks (title, description, PyTorch code).
5. **Cache** — Generated code blocks are persisted in Postgres so repeat visits are instant.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Clerk |
| Database | PostgreSQL via Drizzle ORM |
| File storage | Supabase Storage |
| Embeddings | Hugging Face Inference API |
| Code generation | Ollama (LLM) |
| UI | Tailwind CSS v4 + shadcn/ui |

## Prerequisites

- [Bun](https://bun.sh) (or npm / pnpm / yarn)
- A [Clerk](https://clerk.com) application
- A [Hugging Face](https://huggingface.co) account with an API key
- A [Supabase](https://supabase.com) project (database + storage bucket)
- [Ollama](https://ollama.com) running locally with your chosen model pulled or Ollama API setup

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Clerk
CLERK_SECRET_KEY=sk...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk...

# Database (Supabase Postgres connection string)
DATABASE_URL=postgresql://...

# Supabase Storage
SUPABASE_SECRET_KEY=sb_...
SUPABASE_URL=https://<YOUR_URL>.supabase.co

# Hugging Face
HUGGINGFACE_API_KEY=hf_...
EMBEDDING_MODEL=BAAI/bge-base-en-v1.5

# Ollama
OLLAMA_URL=https://ollama.com
QUERY_MODEL=qwen3-coder-next:cloud
OLLAMA_API_KEY=<YOUR_OLLAMA_API_KEY>
```

### 3. Run database migrations

```bash
bunx drizzle-kit push
```

### 4. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project structure

```
├── app/
│   ├── dashboard/
│   │   ├── actions/          
│   │   ├── chunks/[paperId]/ 
│   │   ├── code/[paperId]/   
│   │   └── pdf/[paperId]/    
│   ├── sign-in/
│   ├── sign-up/
│   ├── layout.tsx
│   └── page.tsx
├── components/               
├── lib/                      
├── src/
│   └── db/
│       └── schema.ts
└── drizzle/
```

## Scripts

| Command | Description |
|---|---|
| `bun dev` | Start development server |
| `bun build` | Production build |
| `bun start` | Start production server |
| `bun lint` | Run ESLint |
| `bunx drizzle-kit push` | Push schema to database |
| `bunx drizzle-kit studio` | Open Drizzle Studio |
