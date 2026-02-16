# 015 - Inline Bot Execution Flow

## Request Flow

```
Client                    Server
  |                         |
  | POST /api/games/[id]/action
  | { action, payload }     |
  |------------------------>|
  |                         | resolveGameAccess()
  |                         | applyAction(state, map, action, payload)
  |                         | runBotTurnsUntilHuman(newState, map)
  |                         |   while current player is bot:
  |                         |     runOneBotAction() -> PLACE_ARMIES | ATTACK | END_TURN
  |                         |     applyAction()
  |                         |     advance until human's turn
  |                         | updateGameState()
  |                         |
  | { success, state }      |
  |<------------------------|
```

## Bot Loop (runBotTurnsUntilHuman)

```
┌─────────────────────────────────────┐
│ current = state                     │
│ i = 0                               │
└─────────────────────────────────────┘
              │
              v
┌─────────────────────────────────────┐
│ player = current.players.find(      │
│   p => p.id === currentPlayerId     │
│ )                                   │
└─────────────────────────────────────┘
              │
              v
     ┌────────────────┐
     │ !player?       │──yes──> return current
     │ player=human? │
     └────────────────┘
              │ no
              v
┌─────────────────────────────────────┐
│ next = runOneBotAction(current, map) │
└─────────────────────────────────────┘
              │
     ┌────────┴────────┐
     │ next === null?  │──yes──> return current
     │ i >= 100?       │
     └────────────────┘
              │ no
              v
┌─────────────────────────────────────┐
│ current = next                      │
│ i++                                 │
└─────────────────────────────────────┘
              │
              └──────> (loop)
```

## Phase Handlers (runOneBotAction)

| Phase     | Bot Action                                      |
|-----------|--------------------------------------------------|
| REINFORCE | Distribute armies → PLACE_ARMIES                 |
| ATTACK    | Find valid attack → ATTACK, else END_TURN        |
| FORTIFY   | END_TURN (no fortify move in MVP)                |
