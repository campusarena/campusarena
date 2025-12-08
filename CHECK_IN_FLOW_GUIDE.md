# Player Check-In Flow

## Files Created

### Server Actions (`src/app/actions/matchActions.ts`)
- `handleCheckIn(matchId, participantId)` - Processes player check-in
- `handleStartMatch(matchId)` - Starts the match when both players are ready

### Check-In Component (`src/components/MatchCheckIn.tsx`)
React component that handles all match states with props:
```typescript
{
  matchId: number;
  currentUserId: number;
  participantId: number | null;
  playerPosition: 'player1' | 'player2' | 'spectator';
  status: string;
  checkIn1: boolean;
  checkIn2: boolean;
  player1Name: string;
  player2Name: string;
}
```

### Match Page (`src/app/match-checkin/[id]/page.tsx`)
Page that loads match data, determines user role, and renders the check-in component.

## How It Works

1. User visits `/match-checkin/[id]`
2. Page loads match data and determines user's role
3. If user is a participant, shows "Check In" button
4. When clicked, calls `handleCheckIn()` server action
5. When both players check in, status auto-transitions to "READY"
6. "Start Match" button appears, either player can start
7. Status changes to "IN_PROGRESS"

## Status Flow

```
PENDING → READY → IN_PROGRESS → COMPLETE
```

## Integration

Link to the match page:
```tsx
<Link href={`/match-checkin/${matchId}`}>Go to Match Check-In</Link>
```

Or embed the component directly:
```tsx
import MatchCheckIn from '@/components/MatchCheckIn';

<MatchCheckIn
  matchId={match.id}
  currentUserId={user.id}
  participantId={participantId}
  playerPosition="player1"
  status={match.status}
  checkIn1={match.checkIn1}
  checkIn2={match.checkIn2}
  player1Name="Team Alpha"
  player2Name="Team Beta"
/>
```

## Testing

1. Create a test match:
```sql
INSERT INTO "Match" 
  ("tournamentId", "p1Id", "p2Id", "status", "checkIn1", "checkIn2", "createdAt")
VALUES 
  (1, 1, 2, 'PENDING', false, false, NOW());
```

2. Visit `/match-checkin/1`
3. Test the check-in and start flow

## Features

- Automatic status transitions
- Real-time updates with server actions
- Team support
- Spectator mode
- Error handling and validation
- Optimistic UI updates

## Security

- All actions run on server
- Validates user is a participant
- Checks match status before allowing actions
- Prevents double check-ins
- Requires authentication
