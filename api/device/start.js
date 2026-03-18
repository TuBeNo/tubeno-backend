
// api/device/start.js  (STATELØS – ingen database)
// Lager deviceId, timestamp, verifier og signatur, og returnerer en loginUrl
// som inneholder alt vi trenger for neste steg (login) uten at vi lagrer noe.

import crypto from "crypto";
import { generateCodeVerifier } from "../pkce.js";

// Sett ditt Vercel-domene her (samme som du bruker som redirect-host):
const BASE = "https://tubeno-backend.vercel.app";

// Hemmelig nøkkel settes i Vercel → Environment Variables → SESSION_SECRET
const SECRET = process.env.SESSION_SECRET;

// Hjelp: lag HMAC-SHA256 signatur av "deviceId:ts:verifier"
function sign(deviceId, ts, verifier) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${deviceId}:${ts}:${verifier}`)
    .digest("hex");
}

export default async function handler(req, res) {
  try {
    if (!SECRET) {
      return res.status(500).json({ error: "SESSION_SECRET mangler i miljøvariabler" });
    }

    // 1) Generer verdier
    const deviceId = crypto.randomUUID();
    const ts = Date.now();
    const verifier = generateCodeVerifier(); // PKCE code_verifier
    const sig = sign(deviceId, ts, verifier);

    // 2) Bygg loginUrl som bærer all info (stateless)
    //    Vi sender med d (deviceId), t (timestamp), v (verifier), s (signature)
    const qp = new URLSearchParams({
      d: deviceId,
      t: String(ts),
      v: verifier,
      s: sig,
    });
    const loginUrl = `${BASE}/api/login?${qp.toString()}`;

    // 3) Returnér data til klient (Android eller nettleser)
    return res.status(200).json({
      deviceId,
      ts,
      signature: sig,
      loginUrl
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Uventet feil i /api/device/start" });
  }
}
