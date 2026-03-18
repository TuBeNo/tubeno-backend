
import crypto from "crypto";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SECRET = process.env.SESSION_SECRET;
const BASE = "https://tubeno-backend.vercel.app";
const REDIRECT_URI = `${BASE}/api/callback`;

function sign(deviceId, ts, verifier) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${deviceId}:${ts}:${verifier}`)
    .digest("hex");
}

export default async function handler(req, res) {
  try {
    const { code, state, error } = req.query;

    if (error) return res.status(400).send("Spotify-feil: " + error);
    if (!code || !state) return res.status(400).send("Mangler code/state");

    const parts = state.split(":");
    if (parts.length !== 4) return res.status(400).send("Ugyldig state");

    const [deviceId, ts, verifier, signature] = parts;

    const checkSig = sign(deviceId, ts, verifier);
    if (checkSig !== signature) {
      return res.status(400).send("Signatur verifisering feilet");
    }

    // code → token
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

    const tokens = await tokenRes.json();

    // base64 token
    const token64 = Buffer.from(JSON.stringify(tokens)).toString("base64");

    // ⭐ NYTT → Redirect til poll-endpoint MED token
    return res.redirect(`${BASE}/api/device/poll?token=${encodeURIComponent(token64)}`);

  } catch (err) {
    console.error("CALLBACK FEIL:", err);
    return res.status(500).send("Uventet feil i /api/callback");
  }
}
