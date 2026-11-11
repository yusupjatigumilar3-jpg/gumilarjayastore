import { qrMatrix } from '@/lib/qr';

// QR Code sebagai SVG di dalam halaman: tidak butuh jaringan, tajam di cetakan,
// dan tidak membocorkan alamat kwitansi ke layanan pihak ketiga.
export default function QrSvg({
  value,
  size = 100,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const matrix = qrMatrix(value);
  if (!matrix) return null;

  const quiet = 2; // pinggir putih; cukup untuk dibaca kamera
  const n = matrix.length;
  const dim = n + quiet * 2;

  // Gabungkan modul gelap yang berurutan per baris menjadi satu segmen path.
  let d = '';
  for (let y = 0; y < n; y++) {
    let x = 0;
    while (x < n) {
      if (matrix[y][x]) {
        let w = 1;
        while (x + w < n && matrix[y][x + w]) w++;
        d += `M${x + quiet} ${y + quiet}h${w}v1h-${w}z`;
        x += w;
      } else {
        x++;
      }
    }
  }

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code untuk memverifikasi kwitansi"
    >
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}
