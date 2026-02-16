'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { signIn } from 'next-auth/react';
import type { AuthProviderId } from '@/lib/auth-config';

const PROVIDER_CONFIG: Record<
  AuthProviderId,
  { label: string; Icon: React.ComponentType }
> = {
  github: { label: 'Sign in with GitHub', Icon: GitHubIcon },
  google: { label: 'Sign in with Google', Icon: GoogleIcon },
  facebook: { label: 'Sign in with Facebook', Icon: FacebookIcon },
};

interface SignInFormProps {
  providers: AuthProviderId[];
}

export default function SignInForm({ providers }: SignInFormProps) {
  if (providers.length === 0) {
    return (
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={3}
          sx={{
            mt: 8,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign In To Lux Touch
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No sign-in providers configured. Set AUTH_* env vars.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In To Lux Touch
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          {providers.map((id) => {
            const { label, Icon } = PROVIDER_CONFIG[id];
            return (
              <Button
                key={id}
                fullWidth
                variant="outlined"
                startIcon={<Icon />}
                onClick={() => signIn(id, { callbackUrl: '/' })}
                sx={{ mb: 2 }}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      </Paper>
    </Container>
  );
}
