---
status: current
owner: Daniel
area: architecture
source: repository-audit
last_verified: 2026-11-05
---

# System Overview

FaithQuest is a Next.js 16 application deployed on Vercel. Supabase provides authentication, PostgreSQL, Row-Level Security, and Realtime updates.

```mermaid
flowchart LR
    B[Browser] --> V[Vercel / Next.js]
    V --> P[Proxy and route protection]
    P --> A[Supabase Auth]
    V --> UI[Teacher and Admin UI]
    UI --> API[Supabase PostgREST]
    API --> RLS[PostgreSQL RLS]
    RLS --> DB[(PostgreSQL)]
    DB --> RT[Supabase Realtime]
    RT --> UI
    UI <--> LS[(LocalStorage cache)]
```

## Current architecture concern

The classroom treats browser state and Supabase as competing data sources. The target architecture makes Supabase authoritative and limits browser storage to an explicit offline cache.

## Related notes

- [[Repository Map]]
- [[System Architecture]]
- [[System Flow]]
- [[Authentication Flow]]
- [[Data Synchronization]]
- [[Multi-User Design]]
