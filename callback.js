export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send("Spotify login feilet: " + error);
  }

  return res.send("Innlogging mottatt! Du kan gå tilbake til TuBeNo-enheten.");
}