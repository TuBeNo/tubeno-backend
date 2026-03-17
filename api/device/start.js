
let sessions = {};

export default async function handler(req, res) {
  const deviceId = crypto.randomUUID();

  sessions[deviceId] = {
    status: "pending",
    token: null
  };

  const loginUrl = `https://tubeno-backend.vercel.app/api/login?device=${deviceId}`;

  res.status(200).json({
    deviceId,
    loginUrl
  });
}

export { sessions };
