# Account Deletion

## Current risk

The source migration uses cascading deletes from profiles to churches and teacher classes. Deleting an Auth user may therefore remove its profile and dependent operational records.

## Required deletion flow

```mermaid
flowchart TD
    A[Request account removal] --> B[Identify owned records]
    B --> C{Owns churches or classes?}
    C -- Yes --> D[Transfer ownership]
    D --> E[Verify replacement]
    C -- No --> E
    E --> F[Verify backup]
    F --> G[Disable account]
    G --> H[Retention period]
    H --> I[Delete identity]
    I --> J[Verify records remain]
```

Production deletion requires explicit scope, backup evidence, and rollback instructions.
