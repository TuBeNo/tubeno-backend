
// api/login.js (STATELØS QR-INNLOGGING)
// Validerer input, signatur, bygger PKCE challenge, og sender bruker til Spotify.
// Ingen database. Ingen lagring i minne. Alt går i URL/state.

import crypto from "crypto";
import { generateCodeChallenge } from "./pkce.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SESSION_SECRET;
const REDIRECT_URI = "https://tubeno-backend.vercel.app/api/callback";

function sign(deviceId, ts, verifier) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${deviceId}:${ts}:${verifier}`)
    .digest("hex");
}

export default async function handler(req, res) {
  try {
    if (!CLIENT_ID || !SECRET) {
      return res.status(500).send("Server mangler CLIENT_ID eller SESSION_SECRET");
    }

    const { d, t, v, s } = req.query; // deviceId, timestamp, verifier, signature
    if (!d || !t || !v || !s) {
      return res.status(400).send("Mangler nødvendige parametere");
    }

    // 1) Bekreft signatur er ekte
    const checkSig = sign(d, t, v);
    if (checkSig !== s) {
      return res.status(400).send("Signatur stemmer ikke");
    }

    // 2) Bygg PKCE challenge
    const challenge = await generateCodeChallenge(v);

    // 3) Velg minimale scopes ABSOLUTT nødvendig
    const scope = [
      "playlist-read-private",
      "playlist-read-collaborative"
    ].join(" ");

    // 4) Bygg OAuth URL
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope,
      state: `${d}:${t}:${v}:${s}`, // gjør /callback stateless
      code_challenge_method: "S256",
      code_challenge: challenge
    });

    const url = "https://accounts.spotify.com/authorize?" + params.toString();

    // 5) Send bruker til Spotify
    return res.redirect(url);

  } catch (err) {
    console.error("LOGIN FEIL:", err);
    return res.status(500).send("Uventet feil i /api/login");
  }
}
