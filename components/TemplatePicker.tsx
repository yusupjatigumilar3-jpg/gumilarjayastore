'use client';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function TemplatePicker({ value, onChange }: Props) {
  const templates = [
    {
      id: 'v3',
      name: 'Modern Band',
      desc: 'Header biru dengan band, cocok untuk bukti pembayaran bisnis',
      preview: (
        <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          <rect width="200" height="140" fill="#fff" />
          <rect width="200" height="30" fill="#2563eb" />
          <rect x="10" y="8" width="14" height="14" rx="3" fill="#fff" opacity=".9" />
          <rect x="30" y="12" width="60" height="4" rx="2" fill="#fff" opacity=".9" />
          <rect x="120" y="12" width="70" height="4" rx="2" fill="#fff" opacity=".9" />
          <rect x="10" y="42" width="60" height="4" rx="2" fill="#cbd5e1" />
          <rect x="10" y="52" width="40" height="3" rx="1.5" fill="#e2e8f0" />
          <rect x="130" y="42" width="60" height="4" rx="2" fill="#cbd5e1" />
          <rect x="140" y="52" width="50" height="3" rx="1.5" fill="#e2e8f0" />
          <rect x="10" y="70" width="180" height="2" fill="#2563eb" />
          <rect x="10" y="80" width="180" height="12" fill="#f1f5f9" />
          <rect x="10" y="98" width="180" height="12" fill="#f1f5f9" />
          <rect x="120" y="118" width="70" height="10" rx="2" fill="#2563eb" />
        </svg>
      ),
    },
    {
      id: 'v4',
      name: 'Company Curve',
      desc: 'Kurva biru atas-bawah, cocok untuk bukti pembayaran formal',
      preview: (
        <svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto' }}>
          <rect width="200" height="140" fill="#fff" />
          <path d="M0,0 L0,25 Q50,40 100,25 T200,15 L200,0 Z" fill="#2563eb" />
          <rect x="10" y="8" width="14" height="14" rx="3" fill="#fff" />
          <rect x="30" y="12" width="60" height="4" rx="2" fill="#fff" />
          <text x="100" y="60" textAnchor="middle" fontSize="16" fontWeight="800" fill="#374151">INVOICE</text>
          <rect x="10" y="75" width="60" height="4" rx="2" fill="#cbd5e1" />
          <rect x="130" y="75" width="60" height="4" rx="2" fill="#cbd5e1" />
          <rect x="10" y="90" width="180" height="10" fill="#4b5563" />
          <rect x="10" y="105" width="180" height="8" fill="#f9fafb" />
          <rect x="140" y="125" width="50" height="8" rx="2" fill="#2563eb" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          style={{
            padding: 16,
            border: `2px solid ${value === t.id ? '#2563eb' : '#e2e8f0'}`,
            borderRadius: 14,
            background: value === t.id ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all .18s',
          }}
        >
          <div style={{
            background: '#f8fafc',
            borderRadius: 10,
            padding: 8,
            marginBottom: 12,
            border: '1px solid #e2e8f0',
          }}>
            {t.preview}
          </div>
          <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: 4, color: '#0b1220' }}>
            {t.name}
            {value === t.id && (
              <span style={{
                marginLeft: 8,
                fontSize: '.7rem',
                padding: '2px 8px',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 99,
                fontWeight: 700,
                letterSpacing: '.04em',
              }}>
                AKTIF
              </span>
            )}
          </div>
          <div style={{ fontSize: '.78rem', color: '#64748b', lineHeight: 1.4 }}>
            {t.desc}
          </div>
        </button>
      ))}
    </div>
  );
}