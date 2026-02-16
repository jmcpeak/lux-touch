# 002 - Auth Integration (Detailed)

Auth.js/NextAuth configuration and authorization rules for the Lux Touch clone.

## Overview

- **Auth provider:** Auth.js v5 (NextAuth)
- **MVP behavior:** Optional auth; anonymous play allowed
- **Authenticated features:** Game saves, load saved games, list/delete owned games

## 1. Session Strategy

### JWT (Stateless)

- **Strategy:** `jwt` — Stateless; suitable for Vercel serverless
- **Max age:** 30 days (configurable)
- **Session payload:** `{ user: { id, email, name, image }, expires }`
- **Storage:** PrismaAdapter for user/account persistence; JWT for session (no DB lookup per request)

### Session Callbacks

```typescript
// jwt callback: encode user.id into token
jwt({ token, user }) {
  if (user) token.id = user.id;
  return token;
}

// session callback: expose user.id to client
session({ session, token }) {
  if (session.user) session.user.id = token.id;
  return session;
}
```

## 2. Provider Configuration

### Supported Providers (MVP)

| Provider | Env Vars | Required |
|----------|----------|----------|
| GitHub | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | No (graceful degrade) |
| Google | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | No |
| Facebook | `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` | No |

- **Credentials (email/password):** Optional for MVP; not implemented initially
- Providers with missing env vars are omitted from the sign-in UI

### Sign-In Flow

1. User visits `/signin`
2. Clicks provider button → `signIn(provider, { callbackUrl: '/' })`
3. OAuth redirect → provider → callback
4. NextAuth creates/updates User + Account in DB
5. Session cookie set; redirect to `callbackUrl`

### Sign-Out Flow

1. User clicks Sign Out → `signOut({ callbackUrl: '/' })`
2. Session cookie cleared
3. Redirect to home

## 3. Authorization Rules

### Access Modes

| Mode | How | When |
|------|-----|------|
| **Authenticated** | `session.user.id` matches `game.userId` | User owns game |
| **Anonymous** | `X-Game-Token` header matches `game.accessToken` | User has token from create response |

### Game Access Resolution (Algorithm)

```
resolveGameAccess(gameId, request):
  1. Load game from DB (404 if not found)
  2. ctx = getAccessContext(request)  // session + X-Game-Token
  3. If ctx.userId && game.userId === ctx.userId → allowed
  4. If ctx.gameToken && game.accessToken === ctx.gameToken → allowed
  5. Else → forbidden (404 to avoid leaking existence)
```

### API Route Matrix

| Route | Auth Required | Access Check | Notes |
|-------|---------------|--------------|-------|
| `POST /api/games` | No | — | If session exists, set `game.userId` |
| `GET /api/games/[id]` | No* | Session or token | *Either ownership or valid token |
| `POST /api/games/[id]/action` | No* | Session or token | Same |
| `GET /api/games` | **Yes** | Session only | 401 if no session |
| `DELETE /api/games/[id]` | **Yes** | Must own | 401 if no session; 404 if not owner |

## 4. Game Access Tokens (Anonymous)

### Creation

- On `POST /api/games` (anonymous): generate `accessToken` (e.g. `nanoid(16)`), store in `games.accessToken`, return in response
- **MVP:** Store plain token (no hashing); hashing can be added later for security

### Usage

- Client stores `accessToken` (e.g. `sessionStorage`) after create
- Sends header: `X-Game-Token: <token>` on `GET /api/games/[id]` and `POST /api/games/[id]/action`
- Token validated by constant-time comparison (when hashed) or direct equality (MVP)

### Token Lifetime

- MVP: No expiry; token valid until game deleted
- Future: Optional TTL, refresh token

## 5. Request/Response Examples

### Authenticated Create Game

```
POST /api/games
Cookie: next-auth.session-token=...
Content-Type: application/json

{ "mapId": "classic", "playerCount": 4 }

→ 200 { gameId, accessToken, state, map }
   (game.userId = session.userId)
```

### Anonymous Create Game

```
POST /api/games
(no Cookie)

{ "mapId": "classic", "playerCount": 4 }

→ 200 { gameId, accessToken, state, map }
   (game.userId = null)
```

### List Games (Auth Required)

```
GET /api/games?status=ACTIVE
Cookie: next-auth.session-token=...

→ 200 { games: [...] }

GET /api/games
(no Cookie)

→ 401 { error: "Unauthorized" }
```

### Access Game (Anonymous)

```
GET /api/games/abc-123
X-Game-Token: xyz789

→ 200 { game, state, map }
   (if game.accessToken === "xyz789")
```

### Access Game (Forbidden)

```
GET /api/games/abc-123
(no session, no X-Game-Token)

→ 404 { error: "Game not found" }
```

## 6. Error Handling

| HTTP | Condition | Response |
|------|-----------|----------|
| 401 | No session on protected route | `{ error: "Unauthorized" }` |
| 404 | Game not found or no access | `{ error: "Game not found" }` |
| 500 | Auth/config error | `{ error: "..." }` |

- Use 404 (not 403) for game access denial to avoid leaking game existence

## 7. Environment Variables

```env
# Required
NEXTAUTH_SECRET=<random-32-chars>
NEXTAUTH_URL=https://your-app.vercel.app

# Optional (OAuth)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_FACEBOOK_ID=
AUTH_FACEBOOK_SECRET=
```

## 8. Implementation Checklist

- [x] NextAuth config: JWT strategy, session callbacks
- [x] PrismaAdapter for users/accounts
- [x] OAuth providers (GitHub, Google, Facebook) with graceful degrade
- [x] `auth()` export for server-side session
- [x] `getAccessContext(request)` — session + X-Game-Token
- [x] `resolveGameAccess(gameId, request)` — ownership or token
- [x] API routes enforce rules per matrix
- [x] Sign-in page at `/signin`
- [x] Sign-in/Sign-out components on home
- [x] `next-auth.d.ts` — extend Session with `user.id`
- [x] `requireAuth()` helper for protected routes
- [x] `getConfiguredProviders()` for sign-in UI

## 9. Testing Strategy

### Unit Tests

- **getAccessContext:** Mock `auth()`, assert `userId` and `gameToken` from session/headers
- **resolveGameAccess:** Mock `auth()` and `prisma.game.findUnique`; assert allowed/forbidden for:
  - User owns game
  - Token matches (anonymous)
  - User does not own, no token
  - User does not own, wrong token
  - Game not found

### Integration Tests (Optional)

- Sign-in flow with test provider
- Create game as anonymous vs authenticated
- Access game with token vs session

## 10. References

- [010-database-schema](../010-database-schema/spec.md) — `users`, `games.userId`, `games.accessToken`
- [011-api-endpoints](../011-api-endpoints/spec.md) — Route contracts
- [014-game-persistence-migration](../014-game-persistence-migration/spec.md) — Access control implementation
