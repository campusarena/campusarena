# Event Check-In Flow

Event-level check-in is the only check-in mechanism.

## Where it lives

- Data: `Participant.checkedIn`
- UI: `src/app/events/[id]/page.tsx` (renders the check-in UI for registered users)
- Action: `src/app/events/[id]/check-in-action.ts` (server action invoked by `CheckInButton`)

## How it works

1. User registers for an event (becomes a `Participant`)
2. User clicks **Check In** on the event page
3. The app sets `Participant.checkedIn = true`
4. Bracket regeneration only seeds checked-in participants

## Notes

- There is no match-level check-in route or API.
