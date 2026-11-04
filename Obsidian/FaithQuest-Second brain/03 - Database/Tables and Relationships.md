# Tables and Relationships

| Table | Purpose | Parent |
|---|---|---|
| `profiles` | Application identity and authority role | `auth.users` |
| `churches` | Organization grouping | administrator profile |
| `teacher_classes` | Teacher-owned classroom | profile and optional church |
| `students` | Student roster | teacher class |
| `activities` | Attendance and point history | student |
| `quizzes` | Quiz definition | teacher class |
| `badges` | Badge catalog and conditions | optional teacher class |
| `rewards` | Reward catalog | optional teacher class |
| `student_rewards` | Purchased/owned rewards | student and reward |
| `audit_logs` | Privileged change evidence | actor profile |
| `student_badges` | Target: awarded badges | student and badge |

## Deletion policy

- Students should normally be archived.
- Classes and churches should normally be soft-deleted.
- Identity deletion must require ownership transfer.
- Historical activity should not disappear when an account is removed.
