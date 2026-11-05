import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-card',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`
        bg-brand-lightGray/80 animate-pulse
        ${variantClasses[variant]}
        ${className}
      `}
    />
  );
};
