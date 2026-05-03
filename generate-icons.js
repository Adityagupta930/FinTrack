const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, 'public', 'icons');

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6c63ff');
  grad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, size, size, size * 0.22);
  ctx.fill();

  // Bolt icon
  ctx.fillStyle = '#ffffff';
  const s = size * 0.52;
  const ox = (size - s) / 2;
  const oy = (size - s) / 2;
  ctx.font = `bold ${s}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚡', size / 2, size / 2 + size * 0.02);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), buf);
  console.log(`✓ icon-${size}.png`);
});

// Screenshot placeholder
const sc = createCanvas(390, 844);
const sctx = sc.getContext('2d');
const sg = sctx.createLinearGradient(0, 0, 390, 844);
sg.addColorStop(0, '#6c63ff');
sg.addColorStop(1, '#a78bfa');
sctx.fillStyle = sg;
sctx.fillRect(0, 0, 390, 844);
sctx.fillStyle = '#fff';
sctx.font = 'bold 32px Arial';
sctx.textAlign = 'center';
sctx.fillText('⚡ FinTrack', 195, 422);
fs.writeFileSync(path.join(outDir, 'screenshot.png'), sc.toBuffer('image/png'));
console.log('✓ screenshot.png');
console.log('All icons generated!');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
