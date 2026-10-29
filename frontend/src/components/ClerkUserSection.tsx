import React from 'react';
import { UserButton, useUser } from '@clerk/react';

export const ClerkUserSection: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
      <UserButton />
    </div>
  );
};
