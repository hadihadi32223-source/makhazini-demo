# Security Notes

This version uses backend authentication instead of browser-only demo login.

## Implemented

- Passwords are verified on the backend.
- Password hashes use PBKDF2 via Node `crypto`.
- The session is stored in an HttpOnly cookie named `wms_session`.
- API routes call authentication/permission checks before returning protected data.
- `/api/auth-me` returns a clean unauthenticated response when no session exists, avoiding browser console 401 noise on the login page.
- Exposed Vercel/Supabase secrets were removed from the project.
- External tracking scripts were removed.
- External Google Fonts links were removed.

## Required before real deployment

- Set a strong `AUTH_SECRET` with at least 32 characters, preferably 64+ random characters.
- Change all default demo passwords.
- Use HTTPS in production.
- Do not commit `.env` or service keys.
- Rotate any Supabase service role key that was previously exposed.

## Removed page

The **تحويل مواقع التخزين** page, route, menu entry, dashboard card, and quick action were removed. Existing backend/data transfer structures remain only for compatibility with old data and reports.
