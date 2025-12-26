# Problem 6: Architecture - Scoreboard API Service Specification

## Overview

This document specifies the architecture and implementation requirements for a real-time scoreboard API service. The system allows users to perform actions that increase their scores, with live updates displayed on a scoreboard showing the top 10 users.

## Requirements

1. Website with a scoreboard displaying top 10 user scores
2. Live updates of the scoreboard
3. Users can perform actions that increase their scores
4. API endpoint to update scores upon action completion
5. Authorization and security to prevent malicious score manipulation

## System Architecture

### Components

1. **Client Application** - Web frontend that displays the scoreboard
2. **API Server** - Backend service handling score updates and queries
3. **Database** - Persistent storage for user scores
4. **Real-time Communication** - WebSocket or Server-Sent Events for live updates
5. **Authentication Service** - User authentication and authorization

### Technology Stack Recommendations

- **Backend Framework**: Express.js / Fastify / NestJS
- **Database**: PostgreSQL / MySQL (for ACID compliance and complex queries)
- **Real-time**: WebSocket (Socket.io) or Server-Sent Events (SSE)
- **Authentication**: JWT tokens with refresh token mechanism
- **Caching**: Redis (for leaderboard caching and rate limiting)
- **Message Queue**: Redis Pub/Sub or RabbitMQ (for score update events)

## API Specification

### 1. Update User Score

**Endpoint**: `POST /api/scores/update`

**Authentication**: Required (Bearer Token)

**Request Body**:

```json
{
  "actionId": "string (unique action identifier)",
  "actionType": "string (type of action completed)",
  "scoreIncrement": number (points to add)
}
```

**Response**:

```json
{
  "success": true,
  "newScore": number,
  "rank": number,
  "message": "Score updated successfully"
}
```

**Error Responses**:

- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Invalid request data
- `429 Too Many Requests` - Rate limit exceeded
- `403 Forbidden` - Action not authorized or duplicate action

### 2. Get Top Scores

**Endpoint**: `GET /api/scores/top?limit=10`

**Authentication**: Optional (for personalized rank)

**Query Parameters**:

- `limit` (optional): Number of top scores to return (default: 10, max: 100)

**Response**:

```json
{
  "scores": [
    {
      "userId": "string",
      "username": "string",
      "score": number,
      "rank": number,
      "lastUpdated": "ISO 8601 timestamp"
    }
  ],
  "totalUsers": number
}
```

### 3. Get User Rank

**Endpoint**: `GET /api/scores/user/:userId/rank`

**Authentication**: Required (user can only query their own rank, or admin)

**Response**:

```json
{
  "userId": "string",
  "username": "string",
  "score": number,
  "rank": number,
  "totalUsers": number
}
```

### 4. Real-time Scoreboard Updates

**Endpoint**: `GET /api/scores/stream` (Server-Sent Events)

**Authentication**: Optional

**Response**: Stream of scoreboard updates

```
data: {"type": "scoreboard_update", "data": {...}}

data: {"type": "user_rank_change", "data": {...}}
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scores Table

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score BIGINT DEFAULT 0 NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_user_id ON scores(user_id);
```

### Action Logs Table

```sql
CREATE TABLE action_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  score_increment INT NOT NULL,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, action_id)
);

CREATE INDEX idx_action_logs_user_id ON action_logs(user_id);
CREATE INDEX idx_action_logs_action_id ON action_logs(action_id);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at);
```

## Security Measures

### 1. Authentication & Authorization

- All score update requests must include a valid JWT token
- Token should include user ID and permissions
- Implement token refresh mechanism
- Validate token expiration on every request

### 2. Action Validation

- **Action ID Uniqueness**: Each action can only be completed once per user
- **Action Type Validation**: Validate action type against allowed types
- **Score Increment Limits**: Enforce maximum score increment per action type
- **Time-based Validation**: Implement cooldown periods for certain actions

### 3. Rate Limiting

- Limit score update requests per user (e.g., 100 requests per minute)
- Implement IP-based rate limiting for additional security
- Use Redis for distributed rate limiting

### 4. Input Validation

- Validate all input data (actionId, actionType, scoreIncrement)
- Sanitize user inputs to prevent injection attacks
- Enforce data type and range constraints

### 5. Duplicate Action Prevention

- Store action IDs in database with unique constraint
- Check for duplicate action IDs before processing
- Return error if action already processed

## Real-time Updates Implementation

### Option 1: Server-Sent Events (SSE)

- Simpler implementation, one-way communication
- Automatic reconnection handling
- Lower overhead than WebSocket
- Suitable for scoreboard updates (server to client)

### Option 2: WebSocket

- Bidirectional communication
- Lower latency
- More complex to implement
- Better for interactive features

### Implementation Flow

1. Client connects to `/api/scores/stream` endpoint
2. Server maintains connection and sends updates when scores change
3. When score is updated:
   - Update database
   - Recalculate top 10 leaderboard
   - Broadcast update to all connected clients
4. Client receives update and refreshes scoreboard UI

## Execution Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. User completes action
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend Application                │
│  - Validates action completion       │
│  - Generates actionId (UUID)         │
│  - Prepares score update request     │
└──────┬──────────────────────────────┘
       │
       │ 2. POST /api/scores/update
       │    Headers: Authorization: Bearer <token>
       │    Body: {actionId, actionType, scoreIncrement}
       │
       ▼
┌─────────────────────────────────────┐
│  API Gateway / Load Balancer        │
│  - Rate limiting                    │
│  - Request routing                  │
└──────┬──────────────────────────────┘
       │
       │ 3. Forward authenticated request
       │
       ▼
┌─────────────────────────────────────┐
│  Authentication Middleware          │
│  - Verify JWT token                 │
│  - Extract user ID                  │
│  - Check token expiration           │
└──────┬──────────────────────────────┘
       │
       │ 4. Validated request with user context
       │
       ▼
┌─────────────────────────────────────┐
│  Score Update Handler               │
│  - Validate input data              │
│  - Check duplicate actionId         │
│  - Verify action type & limits      │
│  - Check rate limits                │
└──────┬──────────────────────────────┘
       │
       │ 5. Transaction: Update score
       │
       ▼
┌─────────────────────────────────────┐
│  Database Transaction                │
│  1. Check if actionId exists        │
│     (prevent duplicate)              │
│  2. Update user score atomically    │
│  3. Insert action log                │
│  4. Get updated rank                 │
└──────┬──────────────────────────────┘
       │
       │ 6. Score updated successfully
       │
       ▼
┌─────────────────────────────────────┐
│  Cache Update (Redis)                │
│  - Update leaderboard cache         │
│  - Invalidate top 10 cache          │
└──────┬──────────────────────────────┘
       │
       │ 7. Publish update event
       │
       ▼
┌─────────────────────────────────────┐
│  Real-time Update Service           │
│  - Recalculate top 10               │
│  - Broadcast to connected clients   │
│  - Send via SSE/WebSocket           │
└──────┬──────────────────────────────┘
       │
       │ 8. Response to client
       │
       ▼
┌─────────────────────────────────────┐
│  Client receives:                    │
│  - Success response with new score  │
│  - Real-time scoreboard update      │
│  - Updated top 10 leaderboard        │
└─────────────────────────────────────┘
```

## Implementation Details

### Score Update Process

1. **Request Validation**

   - Verify JWT token and extract user ID
   - Validate request body structure
   - Check required fields (actionId, actionType, scoreIncrement)

2. **Duplicate Prevention**

   - Query action_logs table for existing actionId + userId
   - If exists, return 403 Forbidden with appropriate message
   - This prevents replay attacks and duplicate submissions

3. **Action Validation**

   - Validate actionType against allowed types
   - Check scoreIncrement against maximum allowed for action type
   - Verify user has permission for this action type

4. **Rate Limiting Check**

   - Check Redis for user's request count in current time window
   - If limit exceeded, return 429 Too Many Requests
   - Increment counter if within limit

5. **Database Transaction**

   - Begin transaction
   - Insert action log (with unique constraint on user_id + action_id)
   - Update user score atomically: `UPDATE scores SET score = score + ? WHERE user_id = ?`
   - Calculate new rank
   - Commit transaction

6. **Cache Update**

   - Update Redis cache for top 10 leaderboard
   - Set expiration time for cache

7. **Real-time Broadcast**

   - Recalculate top 10 scores
   - Publish update event to message queue
   - Broadcast to all connected clients via SSE/WebSocket

8. **Response**
   - Return success response with new score and rank
   - Include updated leaderboard if rank changed

### Top 10 Leaderboard Query

1. **Cache Check**

   - First check Redis cache for top 10
   - If cache hit and not expired, return cached data

2. **Database Query**

   - If cache miss, query database:
     ```sql
     SELECT u.id, u.username, s.score, s.last_updated
     FROM scores s
     JOIN users u ON s.user_id = u.id
     ORDER BY s.score DESC
     LIMIT 10
     ```
   - Store result in Redis cache (TTL: 5-10 seconds)

3. **Real-time Updates**
   - When score updates, invalidate cache
   - Recalculate and broadcast immediately

## Error Handling

### Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Duplicate action or unauthorized action
- `404 Not Found` - User not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Performance Considerations

1. **Database Indexing**

   - Index on scores.score (DESC) for fast leaderboard queries
   - Index on action_logs(user_id, action_id) for duplicate checks
   - Index on scores.user_id for user-specific queries

2. **Caching Strategy**

   - Cache top 10 leaderboard in Redis (5-10 second TTL)
   - Cache user ranks for frequently accessed users
   - Use cache invalidation on score updates

3. **Connection Pooling**

   - Use database connection pooling
   - Limit concurrent database connections

4. **Async Processing**
   - Consider async processing for non-critical operations
   - Use message queue for scoreboard recalculation if needed

## Testing Requirements

1. **Unit Tests**

   - Score update logic
   - Validation functions
   - Authentication middleware

2. **Integration Tests**

   - API endpoint testing
   - Database transaction testing
   - Real-time update testing

3. **Security Tests**

   - Authentication bypass attempts
   - Duplicate action submission
   - Rate limiting effectiveness
   - SQL injection attempts
   - XSS prevention

4. **Load Tests**
   - Concurrent score updates
   - Leaderboard query performance
   - Real-time connection handling

## Deployment Considerations

1. **Horizontal Scaling**

   - Stateless API servers for horizontal scaling
   - Shared Redis for distributed caching and rate limiting
   - Database replication for read scalability

2. **Monitoring**

   - API response times
   - Database query performance
   - Real-time connection count
   - Error rates
   - Rate limit hits

3. **Backup & Recovery**
   - Regular database backups
   - Action log archival strategy
   - Disaster recovery plan

## Additional Improvements & Recommendations

### 1. Action Verification System

**Current Limitation**: Client can send any score increment value.

**Improvement**: Implement server-side action verification:

- Store expected actions and their score values on server
- Client sends action completion event (not score increment)
- Server validates action and calculates score increment
- This prevents clients from manipulating score values

### 2. Anti-Cheat Mechanisms

**Recommendations**:

- Implement server-side action validation
- Add behavioral analysis to detect suspicious patterns
- Implement CAPTCHA for high-value actions
- Track IP addresses and device fingerprints
- Implement anomaly detection for unusual score patterns

### 3. Score Decay System

**Suggestion**: Implement score decay over time to keep leaderboard competitive:

- Scores decrease by small percentage daily/weekly
- Prevents inactive users from staying on leaderboard
- Encourages continued engagement

### 4. Leaderboard Segmentation

**Enhancement**: Support multiple leaderboards:

- Global leaderboard
- Daily/weekly/monthly leaderboards
- Category-specific leaderboards (by action type)
- Regional leaderboards

### 5. Enhanced Real-time Features

**Improvements**:

- Show live rank changes in real-time
- Display "user X just scored Y points" notifications
- Animate scoreboard updates for better UX
- Support for private leaderboards (friends, groups)

### 6. Analytics & Insights

**Add**:

- Track action completion rates
- Monitor score distribution
- Analyze user engagement patterns
- Generate leaderboard statistics

### 7. Database Optimization

**Recommendations**:

- Consider materialized views for leaderboard queries
- Implement database partitioning for action_logs (by date)
- Archive old action logs to separate table
- Use read replicas for leaderboard queries

### 8. API Versioning

**Best Practice**: Implement API versioning from start:

- `/api/v1/scores/update`
- Allows breaking changes without affecting existing clients
- Enables gradual migration

### 9. Webhook Support

**Enhancement**: Allow external systems to subscribe to score updates:

- Webhook endpoints for score changes
- Event notifications for rank changes
- Integration with external analytics systems

### 10. Audit Trail

**Security**: Enhanced logging and audit:

- Log all score update attempts (successful and failed)
- Track IP addresses and user agents
- Implement audit log retention policy
- Support for compliance requirements

## Conclusion

This specification provides a comprehensive foundation for implementing a secure, scalable, and real-time scoreboard API service. The architecture prioritizes security through authentication, duplicate prevention, and rate limiting, while ensuring performance through caching and optimized database queries. The real-time update mechanism keeps the leaderboard current and engaging for users.

The recommended improvements address potential security vulnerabilities, enhance user experience, and provide scalability options for future growth. The implementation team should prioritize security measures and performance optimization while maintaining code quality and testability.
