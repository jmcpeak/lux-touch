import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { auth } from '@/auth';
import SignIn from '@/components/SignIn';
import SignOut from '@/components/SignOut';
import NewGameButtons from '@/components/NewGameButtons';

export default async function Home() {
  const session = await auth();

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
        }}
      >
        {session ? <SignOut /> : <SignIn />}
      </Box>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Lux Touch
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Conquer the world
      </Typography>
      <NewGameButtons />
    </Box>
  );
}
