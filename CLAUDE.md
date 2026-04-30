# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (all tests)
npm run setup        # First-time setup: install, prisma generate + migrate
npm run db:reset     # Force reset SQLite database
```

To run a single test file: `npx vitest run src/path/to/file.test.tsx`

## Architecture

**UIGen** is a Next.js 15 (App Router) app where users describe React components in a chat and Claude generates/edits them live. Preview renders in a sandboxed iframe; everything is in-memory (no disk writes).

### Key data flow

1. User message → `/api/chat` (streaming route)
2. Claude (Haiku 4.5 via Vercel AI SDK) calls two tools:
   - `str_replace_editor` — view/create/str_replace/insert in files
   - `file_manager` — rename/delete files
3. Tool calls stream back to the client and update `VirtualFileSystem` (in-memory, Map-based tree)
4. `FileSystemContext` notifies `FileTree` + `CodeEditor`
5. `PreviewFrame` re-renders: Babel-standalone transpiles JSX → eval'd in sandboxed iframe with an import map

### State management

- `ChatContext` (`/src/lib/contexts/chat-context.tsx`) — chat messages, streaming state, `useChat` hook
- `FileSystemContext` (`/src/lib/contexts/file-system-context.tsx`) — virtual FS + selected file
- Both contexts are provided by `MainContent` in `/src/app/main-content.tsx`

### Auth & persistence

- JWT sessions via `jose` (`/src/lib/auth.ts`), enforced in middleware
- Authenticated users: projects saved to SQLite via Prisma (`User`, `Project` models)
- Anonymous users: work tracked in `localStorage` via `anon-work-tracker.ts`
- Server Actions in `/src/actions/` handle project CRUD with auth checks

### AI provider

`/src/lib/provider.ts` — returns real Anthropic client if `ANTHROPIC_API_KEY` is set; otherwise falls back to a mock provider that returns static components. Real Claude uses up to 40 tool-use steps; mock uses 4. System prompt lives in `/src/lib/prompts/generation.tsx` and uses Anthropic prompt caching (`ephemeral` cache control).

### Path alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Database

The database schema is defined in `prisma/schema.prisma`. Reference it whenever you need to understand the structure of data stored in the database.

## Tech stack

Next.js 15, React 19, TypeScript, Tailwind CSS v4, Radix UI, Monaco Editor, Prisma + SQLite, Vercel AI SDK, Anthropic SDK, Vitest + React Testing Library.
