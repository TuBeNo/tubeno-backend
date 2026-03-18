
import { getIfAlive /*, del */ } from "../_mem.js";

export default async function handler(req, res) {
  const { device } = req.query;
  if (!device) return res.status(400).send("Mangler device");

  const sess = getIfAlive(`sess:${device}`);
  if (!sess) return res.json({ status: "pending" }); // ikke startet/utløpt

  if (sess.status !== "done") {
    return res.json({ status: "pending" });
  }

  // Hvis du vil at token bare kan hentes én gang, kan du slette etterpå:
  // del(`sess:${device}`);

  return res.json({ status: "done", token: sess.token });
}
