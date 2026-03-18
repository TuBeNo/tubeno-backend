
import { getIfAlive, setWithTTL } from "./_mem.js";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const REDIRECT_URI = "https://tubeno-backend.vercel.app/api/callback"; // må være identisk i Spotify Dashboard

export default async function handler(req, res) {
  const { device } = req.query;
  if (!device) return res.status(400).send("Mangler device");

  const sess = getIfAlive(`sess:${device}`);
  if (!sess) return res.status(400).send("Ugyldig/utløpt device");

  // Lag PKCE
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Lagre verifier i samme "slot" (forny TTL til 5 min)
  setWithTTL(`sess:${device}`, { status: "pending", verifier }, 300);

  // Velg KUN scopes du trenger
  const scope = [
    "playlist-read-private",
    "playlist-read-collaborative"
  ].join(" ");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope,
    state: device,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  res.redirect("https://accounts.spotify.com/authorize?" + params.toString());
}
