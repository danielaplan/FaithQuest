# Users and Roles

## Administrator

- Manages churches, teachers, classes, and organization-wide analytics.
- May promote or demote accounts through a protected operation.
- Must not delete an owner until their records are transferred.

## Teacher

- Manages classes they own.
- Manages students, attendance, points, quizzes, rewards, and badges within those classes.
- Must never change their own authority role.

## Student

- Does not currently have an authenticated account.
- Participates through the teacher-controlled classroom or projector experience.

## Authorization principle

The interface is not a security boundary. Supabase RLS and protected database functions must enforce every permission.
