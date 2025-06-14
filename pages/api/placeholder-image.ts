import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the path from the request to customize the placeholder
  const path = req.query.path || 'image';
  const isLogo = path.toString().includes('logo');
  
  // Generate a simple SVG as a placeholder with customized text
  const svg = `
    <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dominant-baseline="middle">
        ${isLogo ? 'Electrophilic Logo' : 'Image Placeholder'}
      </text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}
