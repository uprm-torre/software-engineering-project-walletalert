import React, { useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import AuthButton from "./components/AuthButton";
import Dashboard from "./components/Dashboard";
import LoginPanel from "./components/LoginPanel";
import api from "./api/api";

export default function App() {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const bootstrap = async () => {
      if (!user) return;
      try {
        const token = await getAccessTokenSilently();
        const res = await api.post(
          "/api/bootstrap",
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.status === 201) {
          console.log("Bootstrap: user created", res.data.user);
        } else if (res.status === 200) {
          console.log("Bootstrap: user exists", res.data.user);
        }
      } catch (err) {
        console.error("Bootstrap error:", err?.response?.data || err.message || err);
      }
    };

    if (isAuthenticated) {
      bootstrap();
    }
  }, [isAuthenticated, getAccessTokenSilently, user]);

  return (
    <div className="app-shell">
      <header className="topbar" role="banner">
        <div className="topbar__inner">
          <div className="brand" aria-label="WalletAlert">
            <div className="brand-badge" aria-hidden>WA</div>
            <div>
              <span>WalletAlert</span>
            </div>
          </div>
          <div className="topbar__actions">
            {isAuthenticated && (
              <span aria-live="polite">
                Hi, {user?.given_name || user?.nickname || user?.email}
              </span>
            )}
            <AuthButton />
          </div>
        </div>
      </header>
      <main className="app-shell__main">
        <div className="app-shell__main-inner">
          {!isAuthenticated ? <LoginPanel /> : <Dashboard />}
        </div>
      </main>
    </div>
  );
}
