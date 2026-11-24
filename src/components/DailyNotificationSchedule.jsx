import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import NotificationUserSearch from './NotificationUserSearch';

export default function DailyNotificationSchedule() {
  const [form, setForm] = useState(null);
  const [runs, setRuns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    apiClient.get('/api/v1/admin/notification-schedule').then(({ data }) => {
      if (active) { setForm(data.schedule); setRuns(data.runs || []); }
    }).catch((err) => { if (active) setError(err?.response?.data?.message || 'Could not load schedule.'); });
    return () => { active = false; };
  }, []);
  const set = (field, value) => setForm((old) => ({ ...old, [field]: value }));
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setNotice(''); setError('');
    try {
      const { data } = await apiClient.put('/api/v1/admin/notification-schedule', {
        enabled: form.enabled, title: form.title, message: form.message, target: form.target,
        userId: form.userId, channel: form.channel, priority: form.priority,
        morning: form.morning, evening: form.evening,
      });
      setForm(data.schedule); setNotice(data.schedule.enabled ? 'Daily schedule enabled.' : 'Schedule saved and paused.');
    } catch (err) { setError(err?.response?.data?.message || 'Could not save schedule.'); }
    finally { setBusy(false); }
  };
  const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900';
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-lg font-semibold text-slate-900">Daily notifications</h2><p className="text-sm text-slate-500">Send the same message twice a day. All times use Africa/Lagos.</p></div>
      <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (form?.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600')}>{form?.enabled ? 'Enabled' : 'Paused'}</span>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm text-green-700">{notice}</p>}
    {form && <form onSubmit={save} className="mt-4 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Enable daily schedule</label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Morning<input className={input} type="time" required value={form.morning} onChange={(e) => set('morning', e.target.value)} /></label>
        <label className="text-sm">Evening<input className={input} type="time" required value={form.evening} onChange={(e) => set('evening', e.target.value)} /></label>
        <label className="text-sm">Audience<select className={input} value={form.target} onChange={(e) => set('target', e.target.value)}><option value="all">All active users</option><option value="user">One user</option></select></label>
        <label className="text-sm">Channel<select className={input} value={form.channel} onChange={(e) => set('channel', e.target.value)}><option value="in_app">In-app</option><option value="push">Push</option><option value="email">Email</option><option value="both">Push and email</option><option value="all">All channels</option></select></label>
      </div>
      {form.target === 'user' && <NotificationUserSearch userId={form.userId || ''} onSelect={(id) => set('userId', id)} inputClassName={input} />}
      <label className="block text-sm">Title<input className={input} maxLength={120} required={form.enabled} value={form.title} onChange={(e) => set('title', e.target.value)} /></label>
      <label className="block text-sm">Message<textarea className={input} maxLength={1000} required={form.enabled} rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} /></label>
      <p className="text-xs text-slate-500">Push requires a registered device token. Missed slots older than 10 minutes are skipped. Each slot is attempted once.</p>
      <button disabled={busy} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save schedule'}</button>
    </form>}
    {runs.length > 0 && <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500"><p className="font-semibold">Recent attempts</p>{runs.slice(0, 3).map((run) => <p key={run._id}>{run.slot} · {run.status} · {run.created} created · {run.failed} failed{run.error ? ' · ' + run.error : ''}</p>)}</div>}
  </section>;
}
