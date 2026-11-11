'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateSwitcher from './TemplateSwitcher';
import {
  SETTINGS_GROUPS, SCHEMA_KEYS, HIDDEN_KEYS, validateSettings, type Field,
} from '@/lib/settings-schema';

type Values = Record<string, string>;

// Isi awal tiap kolom: nilai di database, atau nilai bawaan skema bila barisnya belum ada.
function withDefaults(initial: Values): Values {
  const out: Values = { ...initial };
  for (const g of SETTINGS_GROUPS) {
    for (const f of g.fields) {
      if (out[f.key] === undefined) out[f.key] = f.default ?? '';
    }
  }
  return out;
}

export default function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [saved, setSaved] = useState<Values>(() => withDefaults(initial));
  const [values, setValues] = useState<Values>(() => withDefaults(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Model kwitansi punya tombol sendiri yang menyimpan langsung, jadi tidak ikut dihitung sebagai perubahan.
  const dirtyKeys = useMemo(
    () => Object.keys(values).filter((k) => k !== 'invoice_template' && values[k] !== saved[k]),
    [values, saved]
  );
  const dirty = dirtyKeys.length > 0;

  // Peringatan bila halaman ditutup saat masih ada perubahan yang belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
    setBanner(null);
  }

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs)[0];
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;

    const payload: Values = {};
    dirtyKeys.forEach((k) => { payload[k] = values[k]; });

    const local = validateSettings(payload);
    if (Object.keys(local.errors).length > 0) {
      setErrors(local.errors);
      setBanner({ kind: 'err', text: 'Ada isian yang perlu diperbaiki.' });
      focusFirstError(local.errors);
      return;
    }

    setSaving(true);
    setBanner(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) { setErrors(data.fields); focusFirstError(data.fields); }
        throw new Error(data.error || 'Gagal menyimpan.');
      }
      // Server merapikan sebagian nilai (nomor WA, tautan sosial); pakai hasilnya.
      const clean: Values = { ...payload, ...(data.values || {}) };
      setSaved((s) => ({ ...s, ...clean }));
      setValues((v) => ({ ...v, ...clean }));
      setErrors({});
      setBanner({ kind: 'ok', text: `Tersimpan (${dirtyKeys.length} perubahan).` });
      router.refresh();
    } catch (err: any) {
      setBanner({ kind: 'err', text: err.message || 'Gagal menyimpan.' });
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setValues(saved);
    setErrors({});
    setBanner(null);
  }

  async function uploadFile(key: string, file: File) {
    setUploading(key);
    setBanner(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload gagal');
      set(key, data.url);
    } catch (err: any) {
      setErrors((e) => ({ ...e, [key]: err.message || 'Upload gagal' }));
    } finally {
      setUploading(null);
    }
  }

  function control(f: Field) {
    const v = values[f.key] ?? '';
    switch (f.type) {
      case 'image':
        return (
          <div className="st-image">
            {v ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v} alt={`Pratinjau ${f.label}`} />
            ) : (
              <div className="st-image-empty">Belum ada gambar</div>
            )}
            <div className="st-image-actions">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={uploading === f.key}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(f.key, file);
                  e.target.value = '';
                }}
              />
              {v && (
                <button type="button" className="btn btn-ghost" onClick={() => set(f.key, '')}>Hapus gambar</button>
              )}
            </div>
            {uploading === f.key && <small className="st-help">Mengunggah…</small>}
          </div>
        );
      case 'color':
        return (
          <div className="st-color">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#2563eb'} onChange={(e) => set(f.key, e.target.value)} aria-label={f.label} />
            <input type="text" value={v} onChange={(e) => set(f.key, e.target.value)} placeholder="#2563eb" maxLength={7} />
          </div>
        );
      case 'toggle':
        return (
          <label className="st-toggle">
            <input type="checkbox" checked={v === 'true'} onChange={(e) => set(f.key, e.target.checked ? 'true' : 'false')} />
            <span>{v === 'true' ? 'Aktif' : 'Nonaktif'}</span>
          </label>
        );
      case 'textarea':
        return (
          <>
            <textarea rows={3} value={v} onChange={(e) => set(f.key, e.target.value)} />
            {f.max && <small className={`st-count ${v.length > f.max ? 'over' : ''}`}>{v.length}/{f.max}</small>}
          </>
        );
      case 'template':
        return <TemplateSwitcher current={values.invoice_template || 'v3'} />;
      default:
        return (
          <input
            type={f.type === 'email' ? 'email' : 'text'}
            inputMode={f.type === 'phone' ? 'tel' : f.type === 'number' ? 'numeric' : undefined}
            value={v}
            placeholder={f.placeholder}
            onChange={(e) => set(f.key, e.target.value)}
          />
        );
    }
  }

  const unknown = Object.keys(initial).filter((k) => !SCHEMA_KEYS.has(k) && !HIDDEN_KEYS.has(k)).sort();

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <nav className="st-nav" aria-label="Bagian pengaturan">
        {SETTINGS_GROUPS.map((g) => (
          <a key={g.id} href={`#st-${g.id}`}>{g.title}</a>
        ))}
        {unknown.length > 0 && <a href="#st-other">Lainnya</a>}
      </nav>

      {SETTINGS_GROUPS.map((g) => (
        <section key={g.id} id={`st-${g.id}`} className="admin-card st-card">
          <h3>{g.title}</h3>
          {g.description && <p className="st-desc">{g.description}</p>}
          <div className="admin-form-grid">
            {g.fields.map((f) => (
              <div key={f.key} data-field={f.key} className={`st-field ${f.wide ? 'st-wide' : ''} ${errors[f.key] ? 'has-error' : ''}`}>
                <label>{f.label}{f.required && <span className="st-req"> *</span>}</label>
                {control(f)}
                {errors[f.key] ? <small className="st-err">{errors[f.key]}</small> : f.help ? <small className="st-help">{f.help}</small> : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      {unknown.length > 0 && (
        <section id="st-other" className="admin-card st-card">
          <h3>Lainnya</h3>
          <p className="st-desc">Pengaturan tambahan yang ada di database tetapi belum punya kolom khusus.</p>
          <div className="admin-form-grid">
            {unknown.map((k) => (
              <div key={k} data-field={k} className={`st-field ${errors[k] ? 'has-error' : ''}`}>
                <label>{k}</label>
                <input type="text" value={values[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
                {errors[k] && <small className="st-err">{errors[k]}</small>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="st-savebar" role="status" aria-live="polite">
        <span className={banner ? (banner.kind === 'ok' ? 'st-ok' : 'st-bad') : 'st-note'}>
          {banner ? banner.text : dirty ? `${dirtyKeys.length} perubahan belum disimpan` : 'Tidak ada perubahan.'}
        </span>
        <div className="st-savebar-actions">
          {dirty && <button type="button" className="btn btn-ghost" onClick={discard} disabled={saving}>Batalkan</button>}
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving || uploading !== null}>
            {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </form>
  );
}
