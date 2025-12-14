-- Remove match-level check-in columns.
-- Event-level check-in is stored on Participant.checkedIn.

ALTER TABLE "Match" DROP COLUMN IF EXISTS "checkIn1";
ALTER TABLE "Match" DROP COLUMN IF EXISTS "checkIn2";
