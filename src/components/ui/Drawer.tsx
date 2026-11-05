import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: 'start' | 'end';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'start',
}) => {
  const { language } = useApp();
  const isRtl = language === 'ar';
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-brand-darkText/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`fixed inset-y-0 ${side === 'start' ? (isRtl ? 'right-0' : 'left-0') : (isRtl ? 'left-0' : 'right-0')} max-w-full flex`}>
        <div className="w-screen max-w-xs sm:max-w-md bg-white border-s border-brand-border shadow-dialog flex flex-col z-10 animate-in slide-in-from-start duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border/70">
            {title ? <h3 className="text-base font-subheading text-brand-darkText">{title}</h3> : <div />}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق اللوحة"
              className="w-10 h-10 rounded-input flex items-center justify-center text-brand-charcoal hover:bg-brand-lightGray transition-colors focus:outline-none focus:ring-2 focus:ring-brand-plum"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
