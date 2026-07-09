import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => ReactNode;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataGrid<T extends { id?: number | string }>({ columns, data, loading, emptyMessage = 'لا توجد بيانات' }: Props<T>) {
  if (loading) {
    return (
      <div className="modern-loading">
        <div className="modern-spinner" />
        <div>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="modern-table-wrap">
      <table className="data-grid modern-data-grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-right whitespace-nowrap"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="modern-empty-cell">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row.id ?? idx}>
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
