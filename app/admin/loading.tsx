// Tampil seketika saat pindah halaman admin, selama data halaman tujuan masih dimuat.
export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="a-sr">Memuat…</span>
      <div className="a-skel a-skel-title" />
      <div className="a-skel-stats">
        <div className="a-skel a-skel-stat" />
        <div className="a-skel a-skel-stat" />
        <div className="a-skel a-skel-stat" />
        <div className="a-skel a-skel-stat" />
      </div>
      <div className="admin-card">
        <div className="a-skel a-skel-row" />
        <div className="a-skel a-skel-row" />
        <div className="a-skel a-skel-row" />
        <div className="a-skel a-skel-row" />
        <div className="a-skel a-skel-row" />
      </div>
    </div>
  );
}
