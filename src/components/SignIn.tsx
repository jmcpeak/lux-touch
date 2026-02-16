'use client';

import { Button } from '@mui/material';
import { signIn } from 'next-auth/react';

export default function SignIn() {
  return (
    <Button color="inherit" onClick={() => signIn()}>
      Sign In
    </Button>
  );
}
