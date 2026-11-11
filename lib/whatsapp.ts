// Nomor WhatsApp untuk tautan wa.me: hanya angka, awalan negara 62 (Indonesia).
export function cleanPhone(raw: string): string {
  let n = String(raw ?? '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '62' + n.slice(1);
  else if (n && !n.startsWith('62')) n = '62' + n;
  return n;
}
