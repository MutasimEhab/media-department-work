import React from 'react';

export interface MobileCardField<T> {
  label: string;
  render: (item: T) => React.ReactNode;
}

export interface MobileCardListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  titleExtractor: (item: T) => React.ReactNode;
  subtitleExtractor?: (item: T) => React.ReactNode;
  statusExtractor?: (item: T) => React.ReactNode;
  fields: MobileCardField<T>[];
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function MobileCardList<T>({
  items,
  keyExtractor,
  titleExtractor,
  subtitleExtractor,
  statusExtractor,
  fields,
  actions,
  emptyMessage = 'لا توجد بيانات متاحة',
}: MobileCardListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-brand-charcoal/70 bg-white rounded-card border border-brand-border">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {items.map(item => (
        <div
          key={keyExtractor(item)}
          className="bg-white rounded-card border border-brand-border p-4 shadow-subtle flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2 border-b border-brand-border/60 pb-2.5">
            <div>
              <h4 className="font-subheading text-sm text-brand-darkText">{titleExtractor(item)}</h4>
              {subtitleExtractor && (
                <p className="text-xs text-brand-charcoal/70 mt-0.5">{subtitleExtractor(item)}</p>
              )}
            </div>
            {statusExtractor && <div className="shrink-0">{statusExtractor(item)}</div>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {fields.map(field => (
              <div key={field.label} className="flex flex-col">
                <span className="text-brand-charcoal/60 font-medium">{field.label}</span>
                <span className="text-brand-darkText font-medium mt-0.5">{field.render(item)}</span>
              </div>
            ))}
          </div>

          {actions && (
            <div className="pt-2 border-t border-brand-border/60 flex items-center justify-end gap-2">
              {actions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
