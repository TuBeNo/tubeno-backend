
import crypto from "crypto";
import { setWithTTL } from "../_mem.js";

const BASE = "https://tubeno-backend.vercel.app"; // endre senere hvis du bruker eget domene

export default async function handler(req, res) {
  const deviceId = crypto.randomUUID();
  // Lag "pending"-sesjon i 5 minutter
  setWithTTL(`sess:${deviceId}`, { status: "pending" }, 300);

  const loginUrl = `${BASE}/api/login?device=${encodeURIComponent(deviceId)}`;

  res.status(200).json({ deviceId, loginUrl });
}
