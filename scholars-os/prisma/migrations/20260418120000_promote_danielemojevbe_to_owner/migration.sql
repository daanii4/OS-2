-- Data migration: promote org admin account that was created with default counselor role.
-- Safe to re-run: only updates rows matching this email.

UPDATE "profiles"
SET "role" = 'owner'::"UserRole"
WHERE LOWER(TRIM("email")) = LOWER(TRIM('danielemojevbe@gmail.com'));
