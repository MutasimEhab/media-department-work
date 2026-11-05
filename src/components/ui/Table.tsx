import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  caption?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'لا توجد بيانات متاحة',
  caption,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-brand-border bg-white shadow-subtle">
      <table className="w-full text-start border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="bg-brand-lightGray/70 border-b border-brand-border text-brand-darkText font-subheading text-xs">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                className={`py-3.5 px-4 text-start font-bold ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/60">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-brand-charcoal/70">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-magenta border-t-transparent rounded-full animate-spin" />
                  <span>جاري تحميل البيانات...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-brand-charcoal/70">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={keyExtractor(item, idx)}
                className="hover:bg-brand-lightGray/30 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className={`py-3.5 px-4 text-brand-darkText ${col.className || ''}`}>
                    {col.render
                      ? col.render(item, idx)
                      : ((item as Record<string, any>)[col.key] as React.ReactNode)}
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
