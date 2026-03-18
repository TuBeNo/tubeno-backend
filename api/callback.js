
// api/callback.js - Stateless QR Login (viser ferdig poll-lenke)
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
    if (checkSig !== signature) return res.status(400).send("Signatur verifisering feilet");

    // code → tokens
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
    const token64 = Buffer.from(JSON.stringify(tokens)).toString("base64");
    const pollUrl = `${BASE}/api/device/poll?token=${encodeURIComponent(token64)}`;

    // Enkel HTML som viser ferdig lenke
    return res
      .status(200)
      .send(`
        <html>
        <body style="font-family: sans-serif">
          <h2>Innlogging fullført ✅</h2>
          <p>Du kan gå tilbake til TuBeNo‑enheten.<br/>
             For test i nettleser: klikk poll-lenken under.</p>
          <p><a href="${pollUrl}">${pollUrl}</a></p>
          <details>
            <summary>Vis token (base64)</summary>
            <pre style="white-space: pre-wrap; word-break: break-all;">${token64}</pre>
          </details>
        </body>
        </html>
      `);
  } catch (err) {
    console.error("CALLBACK FEIL:", err);
    return res.status(500).send("Uventet feil i /api/callback");
  }
}
