'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useEffect } from 'react';
import { GameBoard } from '@/components/GameBoard';
import { computeReinforcement } from '@/lib/reinforcement';
import { useGameStore } from '@/store/game-store';

export default function GamePage() {
  const mapId = 'classic';
  const { gameId, state, map, createGame, isLoading, error } = useGameStore();

  useEffect(() => {
    if (!gameId && !state && !isLoading) {
      createGame(4, mapId);
    }
  }, [gameId, state, isLoading, createGame, mapId]);

  if (isLoading && !state) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">Creating game...</Typography>
      </Box>
    );
  }

  if (error && !state) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => createGame(4, mapId)}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!state || !map) {
    return null;
  }

  const currentPlayer = state.players.find(
    (p) => p.id === state.currentPlayerId,
  );
  const isMyTurn = currentPlayer?.id === 'human' && !currentPlayer?.isBot;
  const reinforcement =
    isMyTurn && state.phase === 'REINFORCE'
      ? computeReinforcement(state, map, 'human')
      : 0;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        p: 2,
        pb: 6,
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography
          component={Link}
          href="/"
          color="text.secondary"
          sx={{
            fontSize: '0.875rem',
            textDecoration: 'none',
            '&:hover': { color: 'white' },
          }}
        >
          ← Home
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {state.phase} · {currentPlayer?.name ?? '—'}
          {reinforcement > 0 && (
            <Typography component="span" color="primary.main" sx={{ ml: 0.5 }}>
              +{reinforcement} armies
            </Typography>
          )}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <GameBoard
        state={state}
        map={map}
        isMyTurn={isMyTurn}
        reinforcement={reinforcement}
      />
    </Box>
  );
}
