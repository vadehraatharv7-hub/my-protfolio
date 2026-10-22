// Renders public/og-default.png (1200x630) from an inline SVG. Run: node scripts/make-og.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const photo = await sharp(await readFile('public/images/atharv-vadehra.jpg')).resize(300, 300, { fit: 'cover' }).png().toBuffer();
const mask = Buffer.from('<svg width="300" height="300"><rect width="300" height="300" rx="40" fill="#fff"/></svg>');
const rounded = await sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0c0a09"/>
  <rect x="0" y="0" width="12" height="630" fill="#5eead4"/>
  <text x="80" y="230" font-family="Helvetica, Arial, sans-serif" font-size="84" font-weight="700" fill="#f5f5f4">Atharv Vadehra</text>
  <text x="80" y="300" font-family="Helvetica, Arial, sans-serif" font-size="40" fill="#5eead4">aka ARV</text>
  <text x="80" y="400" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#d6d3d1">Cybersecurity MSc student at DTU</text>
  <text x="80" y="452" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="#d6d3d1">DevOps &amp; cloud engineer · Copenhagen</text>
  <text x="80" y="570" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#78716c">Projects · Write-ups · Cyber &amp; AI news</text>
</svg>`;
await sharp(Buffer.from(svg)).composite([{ input: rounded, left: 820, top: 165 }]).png().toFile('public/og-default.png');
console.log('wrote public/og-default.png');
