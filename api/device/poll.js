
import { sessions } from "./start.js";

export default function handler(req, res) {
  const { device } = req.query;

  if (!sessions[device]) {
    return res.status(400).send("Ugyldig device ID");
  }

  const session = sessions[device];

  if (session.status === "pending") {
    return res.json({ status: "pending" });
  }

  return res.json({
    status: "done",
    token: session.token
  });
}
``
