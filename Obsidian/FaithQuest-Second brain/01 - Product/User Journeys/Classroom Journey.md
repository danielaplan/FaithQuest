# Classroom Journey

1. Teacher opens an owned class.
2. The application loads the class and its related records from Supabase.
3. Each classroom action writes one explicit database operation.
4. The UI confirms success only after the write succeeds.
5. Supabase Realtime refreshes other authorized sessions.
6. A local cache may support temporary offline use, but never silently replaces server truth.

See [[../../02 - System/Data Synchronization|Data Synchronization]].
