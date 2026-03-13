# Changelog

## [Latest]

### Added

- Mobile-responsive navbar — notifications, theme toggle, and dashboard button collapse into the user button popover on small screens
- Notifications page (`/notifications`) with pagination and rows-per-page selector
- Notification system — bell icon in the navbar with unread badge; users are alerted when code generation completes or fails, with a direct link to the result
- Retry button on code generation failure or empty result
- Auto-polling — code page polls every 5s and updates automatically when generation finishes
- Unique constraint on `(paper_id, user_id)` in the `code` table to prevent duplicate generation rows
- `status` column on generated code rows (`pending` | `done` | `error`) for lifecycle tracking
- `paper_id` foreign key on notifications for direct navigation to results
- Fira Code font for code blocks

### Changed

- Code generation now inserts a `pending` row before starting and updates to `done` or `error` on completion
- Notifications are only marked success when code blocks are non-empty; empty results trigger an error notification
- `getGeneratedCode` returns `empty` status for done rows with no blocks — prevents auto-regeneration on reload
- Retry flow deletes the stale row before reinserting to avoid conflicts

## [Released]

### Added

- Settings page with profile, account, connected accounts, and danger zone sections
- GitHub and Google OAuth support via Better Auth
- Account linking — connect multiple OAuth providers to a single account
- Auth error page with human-readable messages for all Better Auth error codes
- Per-user Supabase Storage buckets with automatic cleanup on account deletion

### Changed

- Switched authentication from Clerk to [Better Auth](https://better-auth.com) for self-hosted, dependency-free auth
- Migrated auth schema to Drizzle ORM (`user`, `session`, `account`, `verification` tables)
- Replaced Clerk middleware with Better Auth session-based route protection

### Removed

- Clerk dependency and all associated environment variables

## [Earlier]

- Initial release: Turn academic papers into runnable Python code using RAG + LLM
