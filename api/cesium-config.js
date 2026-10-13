export default function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store');
  const token = process.env.CESIUM_ION_TOKEN;
  if (!token) {
    response.status(503).json({ error: 'CESIUM_ION_TOKEN no está configurado en Vercel.' });
    return;
  }
  // CesiumJS uses this read-only browser token to request Google 3D Tiles.
  response.status(200).json({ token });
}
