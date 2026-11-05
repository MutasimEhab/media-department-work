import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  Send,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export type BadgeVariant =
  | 'approved'
  | 'in_progress'
  | 'submitted'
  | 'received'
  | 'returned'
  | 'overdue'
  | 'draft'
  | 'urgent'
  | 'neutral'
  | 'plum';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  // Strictly compliant with brand contrast:
  // Fresh Green #83C704 and Lime #A9D203 are ALWAYS paired with dark text #444444 (WCAG 4.70:1 & 5.52:1)
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; defaultIcon: React.ReactNode }> = {
    approved: {
      bg: 'bg-brand-green/20',
      text: 'text-brand-charcoal',
      border: 'border-brand-green/60',
      defaultIcon: <CheckCircle2 className="w-3.5 h-3.5 text-brand-charcoal" />,
    },
    in_progress: {
      bg: 'bg-brand-magenta/10',
      text: 'text-brand-magenta',
      border: 'border-brand-magenta/30',
      defaultIcon: <Clock className="w-3.5 h-3.5" />,
    },
    submitted: {
      bg: 'bg-brand-plum/10',
      text: 'text-brand-plum',
      border: 'border-brand-plum/30',
      defaultIcon: <Send className="w-3.5 h-3.5" />,
    },
    received: {
      bg: 'bg-brand-lightGray',
      text: 'text-brand-charcoal',
      border: 'border-brand-border',
      defaultIcon: <Clock className="w-3.5 h-3.5" />,
    },
    returned: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      defaultIcon: <RotateCcw className="w-3.5 h-3.5 text-amber-700" />,
    },
    overdue: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      defaultIcon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
    },
    urgent: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-400',
      defaultIcon: <AlertTriangle className="w-3.5 h-3.5 text-red-700" />,
    },
    draft: {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
      defaultIcon: <FileEdit className="w-3.5 h-3.5" />,
    },
    neutral: {
      bg: 'bg-brand-lightGray',
      text: 'text-brand-charcoal',
      border: 'border-brand-border',
      defaultIcon: null,
    },
    plum: {
      bg: 'bg-brand-plum text-white',
      text: 'text-white',
      border: 'border-brand-plum',
      defaultIcon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  };

  const style = variantStyles[variant];
  const renderedIcon = icon !== undefined ? icon : style.defaultIcon;

  return (
    <span
      className={`
        inline-flex items-center rounded-badge border select-none
        ${sizeClasses[size]}
        ${style.bg}
        ${style.text}
        ${style.border}
        ${className}
      `}
    >
      {renderedIcon && <span className="shrink-0">{renderedIcon}</span>}
      <span>{children}</span>
    </span>
  );
};
