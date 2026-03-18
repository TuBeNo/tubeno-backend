
import { getIfAlive, setWithTTL } from "./_mem.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://tubeno-backend.vercel.app/api/callback";

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  if (error) return res.status(400).send("Spotify feil: " + error);
  if (!code || !state) return res.status(400).send("Mangler code/state");

  const sess = getIfAlive(`sess:${state}`);
  if (!sess || !sess.verifier) {
    return res.status(400).send("Ugyldig/utløpt session");
  }

  // Bytt code → tokens
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: sess.verifier
    })
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text();
    return res.status(500).send("Token exchange feilet: " + txt);
  }

  const tokens = await tokenRes.json();

  // Marker "done" og legg inn tokens (gjør de tilgjengelige i 60 min)
  setWithTTL(`sess:${state}`, { status: "done", token: tokens }, 3600);

  // En enkel bekreftelse til brukeren på telefonen
  return res.send("Innlogging fullført! Du kan gå tilbake til TuBeNo‑enheten.");
}
