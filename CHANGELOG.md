# Changelog

## [Released]

- Notification system to alert users when code generation completes

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
