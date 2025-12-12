// src/utils/exportCsv.ts
export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(r =>
      keys.map(k => {
        let v = r[k];
        if (v == null) return "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      }).join(",")
    )
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
