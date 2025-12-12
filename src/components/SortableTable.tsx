import React, { useMemo, useState } from "react";

type Row = { [k: string]: any };

type Props = {
  rows: Row[];
  columns: { key: string; label?: string }[];
  onRowClick?: (r: Row) => void;
  initialSort?: { key: string; desc?: boolean };
};

const SortableTable: React.FC<Props> = ({ rows, columns, onRowClick, initialSort }) => {
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [desc, setDesc] = useState<boolean>(initialSort?.desc ?? false);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const na = typeof va === "string" && !isNaN(parseFloat(va)) ? parseFloat(va) : va;
      const nb = typeof vb === "string" && !isNaN(parseFloat(vb)) ? parseFloat(vb) : vb;
      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;
      if (na > nb) return desc ? -1 : 1;
      if (na < nb) return desc ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, desc]);

  const onHeaderClick = (k: string) => {
    if (sortKey === k) setDesc(!desc);
    else {
      setSortKey(k);
      setDesc(false);
    }
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              onClick={() => onHeaderClick(c.key)}
              style={{
                textAlign: "left",
                padding: "8px 10px",
                cursor: "pointer",
                borderBottom: "1px solid rgba(15,23,36,0.06)",
                fontWeight: 700,
                userSelect: "none",
              }}
            >
              {c.label ?? c.key} {sortKey === c.key ? (desc ? "▾" : "▴") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => (
          <tr
            key={r.MunicipalityCode ?? i}
            onClick={() => onRowClick?.(r)}
            style={{ cursor: onRowClick ? "pointer" : "default", background: i % 2 ? "transparent" : "transparent" }}
          >
            {columns.map((c) => (
              <td key={c.key} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(15,23,36,0.03)" }}>
                {typeof r[c.key] === "number" ? r[c.key].toFixed ? r[c.key].toFixed(3) : r[c.key] : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SortableTable;
