'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from 'next/link';

export default function NewGameButtons() {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Link href="/game" style={{ textDecoration: 'none' }}>
        <Button variant="contained" color="primary" size="large">
          New Game
        </Button>
      </Link>
    </Box>
  );
}
