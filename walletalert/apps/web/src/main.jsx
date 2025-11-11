import React from "react";
import "./index.css";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import { Auth0Provider } from "@auth0/auth0-react";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// If required env vars are missing, render a helpful message instead of letting
// Auth0Provider fail and leaving the page blank.
if (!domain || !clientId) {
  const msg = (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ border: '1px solid #f2dede', background: '#f8d7da', padding: 16, borderRadius: 6 }}>
        <strong>Auth0 not configured for local dev.</strong>
        <p>Set <code>VITE_AUTH0_DOMAIN</code> and <code>VITE_AUTH0_CLIENT_ID</code> in <code>.env</code> under <code>apps/web</code> and restart the dev server.</p>
        <p>Current values:</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>VITE_AUTH0_DOMAIN={String(domain)}
          VITE_AUTH0_CLIENT_ID={String(clientId)}
          VITE_AUTH0_AUDIENCE={String(audience)}</pre>
      </div>
    </div>
  );
  ReactDOM.render(msg, document.getElementById('root'));
} else {
  ReactDOM.render(
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      // auth0-react v1 expects redirectUri and audience as top-level props.
      redirectUri={window.location.origin}
      audience={audience}
      cacheLocation="memory"
    >
      <App />
    </Auth0Provider>,
    document.getElementById('root')
  );
}
