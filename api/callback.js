
import { sessions } from "./device/start.js";

export default async function handler(req, res) {
  const { code, state } = req.query;

  if (!sessions[state]) {
    return res.status(400).send("Ugyldig session");
  }

  const verifier = sessions[state].verifier;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      grant_type: "authorization_code",
      redirect_uri: "https://tubeno-backend.vercel.app/api/callback",
      code,
      code_verifier: verifier
    })
  });

  const data = await tokenRes.json();

  sessions[state].status = "done";
  sessions[state].token = data;

  return res.send("Innlogging fullført! Du kan gå tilbake til TuBeNo‑enheten.");
}
