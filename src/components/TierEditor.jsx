export default function TierEditor({ tiers, onChange, label, onApplyMVP }) {
  function updateRow(i, field, raw) {
    const updated = tiers.map((t, idx) =>
      idx === i ? { ...t, [field]: raw === '' ? null : Number(raw) } : t
    );
    onChange(updated);
  }

  function addRow() {
    onChange([...tiers, { minCost: 0, maxCost: null, markupPercent: 0 }]);
  }

  function removeRow(i) {
    onChange(tiers.filter((_, idx) => idx !== i));
  }

  const numCls =
    'w-full rounded-md bg-gray-100 px-2 py-1.5 text-sm text-gray-900 outline-none focus:bg-white focus:ring-1 focus:ring-orange-400';

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <div className="flex gap-2">
          {onApplyMVP && (
            <button
              type="button"
              onClick={onApplyMVP}
              className="rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100"
            >
              Apply MVP Structure
            </button>
          )}
          <button
            type="button"
            onClick={addRow}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            + Add Tier
          </button>
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <p>No tiers — flat fallback markup will be used.</p>
          <button type="button" onClick={addRow} className="text-xs text-orange-500 hover:underline">
            Add first tier
          </button>
        </div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Min Cost (₦)</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Max Cost (₦)</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Markup %</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tiers.map((tier, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5">
                  <input type="number" min="0" value={tier.minCost ?? ''} onChange={(e) => updateRow(i, 'minCost', e.target.value)} className={numCls} placeholder="0" />
                </td>
                <td className="px-4 py-2.5">
                  <input type="number" min="0" value={tier.maxCost ?? ''} onChange={(e) => updateRow(i, 'maxCost', e.target.value)} className={numCls} placeholder="null = no limit" />
                </td>
                <td className="px-4 py-2.5">
                  <input type="number" min="0" max="100" value={tier.markupPercent ?? ''} onChange={(e) => updateRow(i, 'markupPercent', e.target.value)} className={numCls} placeholder="0" />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" onClick={() => removeRow(i)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
