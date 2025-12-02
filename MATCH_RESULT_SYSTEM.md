# Match Result Submission & Verification System

## Overview
This system allows users to submit match results and admins to verify or reject those submissions.

## Components

### 1. API Routes

#### `/api/match/report` (POST)
- **Purpose**: Submit match results
- **Required Fields**:
  - `matchId`: ID of the match
  - `p1Score`: Score for participant 1
  - `p2Score`: Score for participant 2
  - `winnerParticipantId`: ID of the winning participant
- **What it does**:
  - Creates a MatchReport with PENDING status
  - Updates Match status to REPORTED
  - Returns success message

#### `/api/match/verify` (POST)
- **Purpose**: Admin verification of match results
- **Required Fields**:
  - `reportId`: ID of the match report
  - `action`: Either 'approve' or 'reject'
- **What it does**:
  - **If approved**: 
    - Sets report status to APPROVED
    - Sets match status to VERIFIED
    - Updates match with final scores and winner
  - **If rejected**:
    - Sets report status to REJECTED
    - Resets match status to PENDING
- **Authorization**: Requires ADMIN role

#### `/api/match/pending-reports` (GET)
- **Purpose**: Fetch all pending match reports
- **What it does**:
  - Returns list of all reports with PENDING status
  - Includes match details and team names
- **Authorization**: Requires ADMIN role

### 2. UI Components

#### `ReportScoreModal`
- **Location**: `src/components/ReportScoreModal.tsx`
- **Props**:
  - `matchId`: Match ID
  - `p1Name`: Name of participant 1 (team or player)
  - `p2Name`: Name of participant 2 (team or player)
  - `p1Id`: Participant 1 ID
  - `p2Id`: Participant 2 ID
  - `onSuccess`: Callback after successful submission
- **Features**:
  - Score input validation
  - Tie prevention
  - Success/error messages
  - Auto-closes after successful submission

#### Verify Matches Page
- **Location**: `src/app/admin/verify-matches/page.tsx`
- **Features**:
  - Lists all pending match reports
  - Shows match details, scores, and reporter
  - Approve/Reject buttons for each report
  - Auto-refreshes list after verification
- **Access**: Admin only

### 3. Database Models

#### MatchReport
```prisma
model MatchReport {
  id                   Int          @id @default(autoincrement())
  matchId              Int
  reportedById         Int
  p1Score              Int
  p2Score              Int
  winnerParticipantId  Int
  status               ReportStatus @default(PENDING)
  createdAt            DateTime     @default(now())
  reviewedAt           DateTime?
  reviewedByRoleId     Int?
}
```

#### Enums
```prisma
enum MatchStatus {
  PENDING
  SCHEDULED
  REPORTED
  VERIFIED
  CANCELED
}

enum ReportStatus {
  PENDING
  APPROVED
  REJECTED
}
```

## Workflow

1. **User Submits Score**:
   - User clicks "REPORT SCORE" button on match page
   - Enters scores for both participants
   - System automatically determines winner
   - Submits to `/api/match/report`
   - Match status changes from PENDING → REPORTED

2. **Admin Reviews**:
   - Admin navigates to Admin Dashboard → "Verify Match Results"
   - Views list of pending reports
   - Can see match details and submitted scores
   - Clicks "Approve" or "Reject"

3. **Approval**:
   - Report status: PENDING → APPROVED
   - Match status: REPORTED → VERIFIED
   - Match updated with final scores and winner

4. **Rejection**:
   - Report status: PENDING → REJECTED
   - Match status: REPORTED → PENDING
   - User can submit new report

## Usage Example

### For Users:
```tsx
// In match page
<ReportScoreModal
  matchId={1}
  p1Name="Team Alpha"
  p2Name="Team Beta"
  p1Id={1}
  p2Id={2}
/>
```

### For Admins:
1. Go to `/admin`
2. Click "Verify Match Results" button
3. Review pending reports at `/admin/verify-matches`
4. Approve or reject each report

## Testing

To test this system:

1. **Create test data** (in Prisma Studio or seed file):
   - Create a tournament
   - Create teams
   - Create participants
   - Create a match with PENDING status

2. **Test as User**:
   - Navigate to `/match`
   - Click "REPORT SCORE"
   - Enter scores and submit

3. **Test as Admin**:
   - Login as admin@foo.com
   - Navigate to `/admin`
   - Click "Verify Match Results"
   - Approve or reject the submission

## Future Enhancements

- Add dispute/appeal system
- Add evidence attachment (screenshots, videos)
- Add automated verification based on game API
- Add notification system for report status changes
- Add history view of all reports (not just pending)
