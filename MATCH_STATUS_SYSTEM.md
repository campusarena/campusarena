# Match Status System Documentation

## Overview
This system manages the lifecycle of tournament matches from check-in through completion, with automatic state transitions and validation rules.

## Match Status Flow

```
PENDING → READY → IN_PROGRESS → COMPLETE
   ↓         ↓          ↓
        CANCELED (from any state)
```

### Status Definitions

- **PENDING**: Initial state. Waiting for both participants to check in.
- **READY**: Both participants have checked in. Match can be started.
- **IN_PROGRESS**: Match is actively being played.
- **COMPLETE**: Match has finished. Winner is recorded.
- **CANCELED**: Match was canceled (can happen from any state).

## Database Schema Changes

### MatchStatus Enum (Updated)
```prisma
enum MatchStatus {
  PENDING
  READY        // ✨ NEW
  IN_PROGRESS  // ✨ NEW
  SCHEDULED
  REPORTED
  VERIFIED
  COMPLETE     // ✨ NEW
  CANCELED
}
```

### Match Model (New Fields)
```prisma
model Match {
  // ... existing fields ...
  
  checkIn1 Boolean @default(false)  // ✨ NEW
  checkIn2 Boolean @default(false)  // ✨ NEW
  
  status MatchStatus @default(PENDING)
  winnerId Int? // Already optional
}
```

## API Endpoints

### 1. Check-In: `POST /api/match/check-in`

Allows a participant to check in for a match.

**Request Body:**
```json
{
  "matchId": 123,
  "participantId": 456
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Check-in successful. Waiting for other player.",
  "match": { /* match data */ }
}
```

**When Both Check In:**
```json
{
  "success": true,
  "message": "Both players checked in. Match is now READY!",
  "match": { /* match with status: "READY" */ }
}
```

**Validation Rules:**
- Cannot check in if match is `IN_PROGRESS` or `COMPLETE`
- Cannot check in twice
- Must be a participant in the match

---

### 2. Start Match: `POST /api/match/start`

Starts a match that is ready.

**Request Body:**
```json
{
  "matchId": 123
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Match started successfully",
  "match": { /* match with status: "IN_PROGRESS" */ }
}
```

**Validation Rules:**
- Can only start if status is `READY`
- Requires both players to have checked in first

---

### 3. Complete Match: `POST /api/match/complete`

Completes a match and records the winner.

**Request Body:**
```json
{
  "matchId": 123,
  "winnerId": 456,
  "p1Score": 21,    // optional
  "p2Score": 15     // optional
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Match completed successfully",
  "match": { 
    /* match with status: "COMPLETE", winnerId set, completedAt timestamp */
  }
}
```

**Features:**
- Automatically advances winner to next bracket match if `nextMatchId` exists
- Records completion timestamp
- Optional score recording

**Validation Rules:**
- Can only complete if status is `IN_PROGRESS`
- Winner must be one of the match participants

---

## Helper Functions

Located in `src/lib/matchStatusHelpers.ts`

### `updateCheckIn(matchId, participantId)`
Updates check-in and auto-transitions to READY when both players check in.

```typescript
const result = await updateCheckIn(123, 456);
if (result.bothCheckedIn) {
  console.log('Match is ready!');
}
```

### `startMatch(matchId)`
Starts a match. Throws error if not in READY state.

```typescript
try {
  const match = await startMatch(123);
  console.log('Match started:', match);
} catch (error) {
  console.error('Cannot start:', error.message);
}
```

### `completeMatch(matchId, winnerId, p1Score?, p2Score?)`
Completes a match with winner and optional scores.

```typescript
const match = await completeMatch(123, 456, 21, 15);
```

### `areBothPlayersCheckedIn(matchId)`
Checks if both participants have checked in.

```typescript
const ready = await areBothPlayersCheckedIn(123);
// Returns: true/false
```

### `validateMatchTransition(currentStatus, targetStatus)`
Validates if a status transition is allowed.

```typescript
const validation = validateMatchTransition('PENDING', 'IN_PROGRESS');
if (!validation.isValid) {
  console.error(validation.error);
}
```

### `getMatchStatusSummary(matchId)`
Gets comprehensive match status information.

```typescript
const summary = await getMatchStatusSummary(123);
console.log({
  status: summary.status,
  bothCheckedIn: summary.bothCheckedIn,
  canStart: summary.canStart,
  canComplete: summary.canComplete,
  isFinished: summary.isFinished
});
```

---

## Migration Instructions

### Step 1: Apply Schema Changes
```bash
npx prisma migrate dev --name add_match_check_in_system
```

This will:
- Add `checkIn1` and `checkIn2` fields to Match model
- Add `READY`, `IN_PROGRESS`, `COMPLETE` to MatchStatus enum
- All existing matches keep their current status

### Step 2: Coordinate with Team
Important: Your teammates need to:
1. Pull your branch
2. Run `npx prisma migrate dev` to apply the migration
3. Run `npx prisma generate` to update Prisma Client

### Step 3: No Breaking Changes
The changes are additive only:
- New enum values don't break existing code
- New boolean fields default to `false`
- Existing matches continue to work
- No data loss

---

## Usage Examples

### Frontend Example: Check-In Flow

```typescript
// Player checks in
const checkIn = async (matchId: number, participantId: number) => {
  const response = await fetch('/api/match/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, participantId })
  });
  
  const data = await response.json();
  
  if (data.success) {
    if (data.match.status === 'READY') {
      alert('Both players ready! Match can start!');
    } else {
      alert('Checked in. Waiting for opponent...');
    }
  }
};
```

### Frontend Example: Start Match

```typescript
const startMatch = async (matchId: number) => {
  const response = await fetch('/api/match/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId })
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Match started! Good luck!');
    // Navigate to match page or start timer
  } else {
    alert(data.error);
  }
};
```

### Frontend Example: Complete Match

```typescript
const completeMatch = async (
  matchId: number, 
  winnerId: number,
  p1Score: number,
  p2Score: number
) => {
  const response = await fetch('/api/match/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, winnerId, p1Score, p2Score })
  });
  
  const data = await response.json();
  
  if (data.success) {
    alert('Match completed! Winner recorded.');
    // Show results, navigate to bracket, etc.
  }
};
```

---

## Validation Summary

| Action | Required Status | Conditions |
|--------|----------------|------------|
| Check-in | `PENDING` or `READY` | - Cannot check in if already checked in<br>- Cannot check in if `IN_PROGRESS` or `COMPLETE` |
| Start | `READY` | - Both players must be checked in<br>- Status must be exactly `READY` |
| Complete | `IN_PROGRESS` | - Winner must be a participant<br>- Status must be exactly `IN_PROGRESS` |

---

## State Transition Rules

```typescript
const validTransitions = {
  PENDING: ['READY', 'CANCELED'],
  READY: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['COMPLETE', 'CANCELED'],
  COMPLETE: [], // Final state
  CANCELED: []  // Final state
};
```

---

## Error Handling

All API endpoints return consistent error formats:

```json
{
  "error": "Error message here",
  "currentStatus": "PENDING",
  "requiredStatus": "READY"
}
```

Common errors:
- `401`: Unauthorized (not logged in)
- `400`: Validation error (wrong status, invalid participant, etc.)
- `404`: Match not found
- `500`: Server error

---

## Testing Checklist

- [ ] Two players can check in to a match
- [ ] Match auto-transitions to READY when both check in
- [ ] Cannot check in twice
- [ ] Cannot check in after match starts
- [ ] Can only start READY matches
- [ ] Cannot start PENDING matches
- [ ] Can only complete IN_PROGRESS matches
- [ ] Winner is recorded correctly
- [ ] Scores are saved (if provided)
- [ ] Winner advances to next bracket match
- [ ] All validation rules are enforced

---

## Future Enhancements

Potential additions:
- Auto-forfeit if player doesn't check in within time limit
- Match timer during IN_PROGRESS
- Dispute resolution workflow
- Best-of-N match series support
- Spectator mode status
