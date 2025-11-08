const prod = process.env.NODE_ENV === "production";

let checkJwt;

if (prod) {
  // Production: require valid JWT
  const { auth } = await import("express-oauth2-jwt-bearer");
  checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    tokenSigningAlg: "RS256",
  });
} else {
  // Development: be permissive. If no Authorization header, inject a default dev identity.
  // If Authorization exists and the validator package is installed, verify it; otherwise fall back to dev identity.
  checkJwt = (req, res, next) => {
    const devSub = req.headers["x-dev-sub"] || "dev|local-user";
    const devEmail = req.headers["x-dev-email"] || "dev@example.com";
    const hasAuthHeader = !!req.headers["authorization"];

    // No token provided — allow through with dev identity
    if (!hasAuthHeader) {
      req.auth = { payload: { sub: devSub, email: devEmail } };
      return next();
    }

    // Token provided — try validating if library is available; else, fall back to dev identity
    return import("express-oauth2-jwt-bearer")
      .then(({ auth }) =>
        auth({
          audience: process.env.AUTH0_AUDIENCE,
          issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
          tokenSigningAlg: "RS256",
        })(req, res, next)
      )
      .catch(() => {
        req.auth = { payload: { sub: devSub, email: devEmail } };
        next();
      });
  };
}

export { checkJwt };
