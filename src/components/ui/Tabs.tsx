import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-brand-border ${className}`}>
      <div
        role="tablist"
        aria-label="علامات التبويب"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar"
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 py-3 px-3.5 sm:px-4 text-xs sm:text-sm font-subheading border-b-2
                whitespace-nowrap transition-colors min-h-[44px] focus:outline-none focus:text-brand-plum
                ${
                  isActive
                    ? 'border-brand-magenta text-brand-magenta font-bold'
                    : 'border-transparent text-brand-charcoal hover:text-brand-darkText hover:border-brand-border'
                }
                ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`
                    px-1.5 py-0.5 rounded-full text-[10px] font-mono
                    ${isActive ? 'bg-brand-magenta/15 text-brand-magenta' : 'bg-brand-lightGray text-brand-charcoal'}
                  `}
                  dir="ltr"
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
