
// api/callback.js - Stateless QR Login
// Tar imot Spotify code + state, validerer signatur og bytter code→token
// Ingen database. Ingen lagring. Token leveres i /api/device/poll som base64.

import crypto from "crypto";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SESSION_SECRET;
const REDIRECT_URI = "https://tubeno-backend.vercel.app/api/callback";

// HMAC signering må være identisk med /api/login og /api/device/start
function sign(deviceId, ts, verifier) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${deviceId}:${ts}:${verifier}`)
    .digest("hex");
}

export default async function handler(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).send("Spotify-feil: " + error);
    }
    if (!code || !state) {
      return res.status(400).send("Mangler code/state fra Spotify");
    }

    // State ser slik ut: deviceId:ts:verifier:signature
    const parts = state.split(":");
    if (parts.length !== 4) {
      return res.status(400).send("Ugyldig state");
    }

    const [deviceId, ts, verifier, signature] = parts;

    // Valider signaturen
    const checkSig = sign(deviceId, ts, verifier);
    if (checkSig !== signature) {
      return res.status(400).send("Signatur verifisering feilet");
    }

    // Bytt code → token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: verifier
      })
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      return res.status(500).send("Feil ved token-bytte: " + txt);
    }

    const tokens = await tokenRes.json();

    // KLART: token pakkes inn i base64 og sendes som URL for poll-endpoint
    const token64 = Buffer.from(JSON.stringify(tokens)).toString("base64");

    const pollUrl = `https://tubeno-backend.vercel.app/api/device/poll?token=${token64}`;

    return res.send(
      "Innlogging fullført!<br><br>" +
      "Nå kan du gå tilbake til TuBeNo‑enheten.<br><br>" +
      "(Den henter token via /api/device/poll)"
    );

  } catch (err) {
    console.error("CALLBACK FEIL:", err);
    return res.status(500).send("Uventet feil i /api/callback");
  }
}
