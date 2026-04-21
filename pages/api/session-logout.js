export default function handler(req, res) {
  res.setHeader("Set-Cookie", "__session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/");
  res.status(200).json({ ok: true });
}
