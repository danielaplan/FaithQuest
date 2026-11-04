# System Architecture

## Current

```mermaid
flowchart TD
    UI[Client components] --> MEM[React state]
    MEM --> LOCAL[LocalStorage]
    MEM --> SYNC[Whole-state background sync]
    SYNC --> TABLES[Supabase relational tables]
    TABLES --> REALTIME[Realtime]
    REALTIME --> MEM
```

Risks: partial synchronization, silent write failures, stale deletions, and last-writer-wins conflicts.

## Target

```mermaid
flowchart TD
    UI[Client components] --> CMD[Explicit domain command]
    CMD --> RLS[Authorized PostgREST or RPC]
    RLS --> TX[Transactional database write]
    TX --> DB[(Supabase PostgreSQL)]
    DB --> RT[Realtime event]
    RT --> CACHE[Refresh client query cache]
    CACHE --> UI
    UI --> OFFLINE[Optional queued offline command]
```

## Design rules

1. PostgreSQL is authoritative.
2. RLS enforces ownership regardless of UI behavior.
3. Multi-row operations use transactions or RPC functions.
4. Failed writes remain visible and retryable.
5. Realtime updates refresh authorized data, not entire browser snapshots.
