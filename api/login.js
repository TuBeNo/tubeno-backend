
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.js";
import { sessions } from "./device/start.js";

export default async function handler(req, res) {
  const { device } = req.query;
  if (!device || !sessions[device]) {
    return res.status(400).send("Ugyldig device ID");
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  sessions[device].verifier = verifier;

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: "https://tubeno-backend.vercel.app/api/callback",
    scope: "playlist-read-private playlist-read-collaborative",
    state: device,
    code_challenge_method: "S256",
    code_challenge: challenge
  });

  res.redirect("https://accounts.spotify.com/authorize?" + params.toString());
}
