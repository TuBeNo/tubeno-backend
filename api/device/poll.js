
export default async function handler(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.json({ status: "pending" });
    }

    // Dekode Spotify-token
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));

    return res.json({
      status: "done",
      token: decoded
    });

  } catch (e) {
    console.error("POLL FEIL:", e);
    return res.status(500).json({ error: "Feil i poll" });
  }
}
