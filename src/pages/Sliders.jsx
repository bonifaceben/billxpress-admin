import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { sliderPayload } from '../lib/sliderPayload';

const ENDPOINT = '/api/v1/admin/sliders';
const inputCls = 'mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-orange-500';
const buttonCls = 'rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50';
const primaryCls = 'rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50';
const messageOf = (err, fallback) => err?.response?.data?.message ?? err.message ?? fallback;

function SliderForm({ slider, onClose, onSaved }) {
  const [form, setForm] = useState({ title: slider?.title ?? '', imageUrl: slider?.imageUrl ?? '', linkUrl: slider?.linkUrl ?? '', isActive: slider?.isActive ?? true, sortOrder: slider?.sortOrder ?? 0 });
  const [source, setSource] = useState(slider ? 'url' : 'upload');
  const [imageBase64, setImageBase64] = useState('');
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function readImage(event) {
    const file = event.target.files?.[0];
    setImageBase64('');
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file.'); return; }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => { setImageBase64(String(reader.result)); setReading(false); };
    reader.onerror = () => { setError('Could not read the image. Please try again.'); setReading(false); };
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      if (source === 'upload' && !imageBase64 && !slider) throw new Error('Choose an image to upload.');
      const payload = sliderPayload({ ...form, imageUrl: source === 'upload' ? slider?.imageUrl ?? '' : form.imageUrl }, slider, source === 'upload' ? imageBase64 : '');
      if (!Object.keys(payload).length) { onClose(); return; }
      setSaving(true);
      if (slider) await apiClient.patch(`${ENDPOINT}/${encodeURIComponent(slider.id)}`, payload);
      else await apiClient.post(ENDPOINT, payload);
      onSaved(slider ? 'Slider updated.' : 'Slider created.');
    } catch (err) { setError(messageOf(err, 'Could not save slider.')); }
    finally { setSaving(false); }
  }

  const preview = source === 'upload' ? imageBase64 || slider?.imageUrl : form.imageUrl;
  return (
    <form onSubmit={submit} className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{slider ? 'Edit slider' : 'Create slider'}</h2>
      <fieldset disabled={saving || reading} className="space-y-4 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-700">Title (optional)<input autoFocus className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
          <label className="text-sm text-gray-700">Link target (optional)<input className={inputCls} placeholder="/services/data or an app/HTTPS link" value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} /><span className="mt-1 block text-xs text-gray-500">Leave blank for a banner with no navigation.</span></label>
          <label className="text-sm text-gray-700">Sort order<input type="number" required step="1" className={inputCls} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /><span className="mt-1 block text-xs text-gray-500">Lower numbers appear first.</span></label>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />Active — show in the customer app</label>
        </div>
        <label className="block text-sm text-gray-700">Image source<select className={inputCls} value={source} onChange={(e) => { setSource(e.target.value); setError(''); }}><option value="upload">Upload image (recommended)</option><option value="url">Hosted image URL</option></select></label>
        {source === 'upload' ? <label className="block text-sm text-gray-700">{slider ? 'Replacement image (optional)' : 'Banner image'}<input className={inputCls} type="file" accept="image/*" onChange={readImage} /></label> : <label className="block text-sm text-gray-700">Image URL<input type="url" required className={inputCls} value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…/banner.webp" /></label>}
        {preview && <div><p className="mb-2 text-xs text-gray-500">Image preview</p><img src={preview} alt="Slider preview" className="max-h-56 max-w-full rounded-lg border border-gray-200 object-contain" /></div>}
        <div className="flex gap-3"><button type="submit" className={primaryCls}>{saving ? 'Saving…' : 'Save slider'}</button><button type="button" onClick={onClose} className={buttonCls}>Cancel</button></div>
      </fieldset>
      {reading && <p role="status" className="mt-3 text-sm text-gray-500">Reading image…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

export default function Sliders() {
  const [sliders, setSliders] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get(ENDPOINT, { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const payload = data?.data ?? data;
      if (!Array.isArray(payload?.sliders)) throw new Error('Unexpected sliders response.');
      setSliders([...payload.sliders].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
      setCount(payload.count ?? payload.sliders.length);
    }).catch((err) => {
      if (!controller.signal.aborted) setError(messageOf(err, 'Could not load sliders.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  function refresh() { setLoading(true); setError(''); setRevision((value) => value + 1); }
  function saved(message) { setEditor(null); setSuccess(message); refresh(); }
  function createBanner() { setEditor({}); setDeleting(null); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  async function remove(slider) {
    setBusy(true); setError(''); setSuccess('');
    try {
      await apiClient.delete(`${ENDPOINT}/${encodeURIComponent(slider.id)}`);
      setDeleting(null); setSuccess('Slider deleted.'); refresh();
    } catch (err) { setError(messageOf(err, 'Could not delete slider.')); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4">
        <div><h1 className="text-2xl font-semibold text-gray-900">Sliders</h1><p className="mt-1 text-sm text-gray-500">Manage active and inactive home-screen banners.</p></div>
        <div className="flex flex-wrap gap-3"><button onClick={createBanner} disabled={busy || !!editor} className={primaryCls}>Upload banner</button><button onClick={refresh} disabled={loading || busy || !!editor} className={buttonCls}>Refresh</button></div>
      </div>
      {success && <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</p>}
      {editor && <SliderForm key={editor.id ?? 'new'} slider={editor.id ? editor : null} onClose={() => setEditor(null)} onSaved={saved} />}
      {error && <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}<button disabled={busy} onClick={refresh} className="ml-3 underline">Retry list</button></div>}
      {loading ? <p role="status" className="py-16 text-center text-sm text-gray-500">Loading sliders…</p> : <>
        <p className="mb-4 text-sm text-gray-500">{count} sliders · {sliders.filter((slider) => slider.isActive).length} active</p>
        {sliders.length === 0 && !error && <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-500"><p className="mb-4">No sliders yet. Upload your first banner to get started.</p><button onClick={createBanner} disabled={busy || !!editor} className={primaryCls}>Upload banner</button></div>}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sliders.map((slider) => <article key={slider.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center bg-gray-100"><img src={slider.imageUrl} alt={slider.title || 'Banner'} className="h-full w-full object-contain" loading="lazy" /></div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2"><h2 className="break-words font-semibold text-gray-900">{slider.title || 'Untitled slider'}</h2><span className={`rounded-full px-2 py-1 text-xs ${slider.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{slider.isActive ? 'Active' : 'Inactive'}</span></div>
              <p className="break-all text-sm text-gray-500">{slider.linkUrl || 'No link — no navigation'}</p>
              <p className="text-sm text-gray-500">Sort order: {slider.sortOrder ?? 0}</p>
              <div className="text-xs text-gray-400"><p>Created: {slider.createdAt ? new Date(slider.createdAt).toLocaleString() : '—'}</p><p>Updated: {slider.updatedAt ? new Date(slider.updatedAt).toLocaleString() : '—'}</p></div>
              {deleting === slider.id ? <div className="space-y-2 rounded-md bg-red-50 p-3"><p className="text-sm text-red-700">Delete this slider permanently? Its uploaded image may also be removed.</p><div className="flex gap-2"><button disabled={busy} onClick={() => remove(slider)} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Deleting…' : 'Delete permanently'}</button><button disabled={busy} onClick={() => setDeleting(null)} className={buttonCls}>Cancel</button></div></div> : <div className="flex gap-2"><button disabled={busy || !!editor} onClick={() => { setEditor(slider); setDeleting(null); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={buttonCls}>Edit</button><button disabled={busy || !!editor} onClick={() => setDeleting(slider.id)} className="px-3 py-2 text-sm text-red-600 disabled:opacity-50">Delete</button></div>}
            </div>
          </article>)}
        </div>
      </>}
    </div>
  );
}
