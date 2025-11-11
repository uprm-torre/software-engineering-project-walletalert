import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "../components/ui/Button";

const LoginPanel = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <section
      className="panel login-card"
      aria-labelledby="walletalert-login-heading"
    >
      <div className="brand-badge login-card__badge" aria-hidden>
        WA
      </div>
      <h1 className="login-card__title" id="walletalert-login-heading">
        Welcome to WalletAlert
      </h1>
      <p className="login-card__subtitle">
        Track spending, build budgets, and keep your finances on course.
      </p>
      <Button
        type="button"
        className="w-full"
        onClick={() => loginWithRedirect()}
      >
        Continue with Auth0
      </Button>
      <p className="form-helper" style={{ marginTop: "16px" }}>
        Secure enterprise-grade authentication powered by Auth0.
      </p>
    </section>
  );
};

export default LoginPanel;
