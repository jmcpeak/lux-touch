'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import { IconButton, Tooltip } from '@mui/material';
import { signOut } from 'next-auth/react';

export default function SignOut() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <Tooltip title="Sign Out">
      <IconButton color="inherit" onClick={handleSignOut} aria-label="Sign Out">
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  );
}
