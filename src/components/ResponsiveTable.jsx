import { useEffect, useRef } from 'react';

// Keep the original cells and controls mounted when the available width changes.
export default function ResponsiveTable({ children, className = '', ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const table = ref.current;
    const container = table.parentElement;
    function update() {
      const headings = [...table.querySelectorAll('thead tr:first-child th')].map((cell) => cell.textContent.trim());
      const minimumWidth = Math.max(headings.length * 145, 560);
      table.dataset.cards = String(container.clientWidth < minimumWidth);
      table.querySelectorAll('tbody tr').forEach((row) => {
        [...row.children].forEach((cell, index) => {
          cell.dataset.label = cell.colSpan > 1 ? '' : headings[index] ?? '';
        });
      });
    }
    update();
    const resize = new ResizeObserver(update);
    resize.observe(container);
    const mutation = new MutationObserver(update);
    mutation.observe(table, { childList: true, subtree: true, characterData: true });
    return () => { resize.disconnect(); mutation.disconnect(); };
  }, []);
  return <table ref={ref} className={`responsive-table ${className}`} {...props}>{children}</table>;
}
