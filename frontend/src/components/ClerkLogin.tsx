import React, { useEffect } from 'react';
import { SignIn, useUser, useAuth } from '@clerk/react';
import { UserInfo } from '../services/api';

interface ClerkLoginProps {
  onLoginSuccess: (userInfo: UserInfo) => void;
}

export const ClerkLogin: React.FC<ClerkLoginProps> = ({ onLoginSuccess }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function syncClerkUser() {
      if (isLoaded && isSignedIn && user) {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem("eduverify_token", token);
          }
          const email = user.primaryEmailAddress?.emailAddress || `${user.id}@clerk.user`;
          const role = (user.publicMetadata?.role as string) || "AICTE_ADMIN";
          const institutionId = (user.publicMetadata?.institution_id as string) || undefined;
          const institutionName = (user.publicMetadata?.institution_name as string) || undefined;

          const userInfo: UserInfo = {
            id: user.id,
            username: user.username || user.firstName || user.id,
            email,
            role,
            institution_id: institutionId,
            institution_name: institutionName
          };
          localStorage.setItem("eduverify_user", JSON.stringify(userInfo));
          onLoginSuccess(userInfo);
        } catch (e) {
          console.error("Clerk sync error:", e);
        }
      }
    }
    syncClerkUser();
  }, [isLoaded, isSignedIn, user, getToken, onLoginSuccess]);

  return (
    <div className="flex justify-center items-center py-2">
      <SignIn routing="hash" />
    </div>
  );
};
