const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/*
| Reads the `exp` claim without verifying the signature. That is fine for
| what it is used for -- deciding when to stop trusting a token locally.
| The server still verifies every request; this only avoids firing doomed
| requests and leaving the UI looking signed in after the token has died.
*/

export function getTokenExpiry(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");

    if (!payload) return null;

    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );

    return typeof decoded.exp === "number"
      ? decoded.exp * 1000
      : null;
  } catch {
    return null;
  }
}

/*
| A token with no readable expiry is treated as valid and left to the
| server to reject, rather than logging the user out on a parse quirk.
*/

export function isTokenExpired(token) {
  const expiresAt = getTokenExpiry(token);

  return expiresAt !== null && expiresAt <= Date.now();
}
