import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "./ui/Button";

const AuthButton = () => {
  const { logout, isAuthenticated, loginWithRedirect } = useAuth0();

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={() => loginWithRedirect()}
      >
        Sign In
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() =>
        logout({ logoutParams: { returnTo: window.location.origin } })
      }
    >
      Log Out
    </Button>
  );
};

export default AuthButton;