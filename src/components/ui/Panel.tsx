import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noBorder?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ 
  children, 
  className = '', 
  noBorder = false,
  ...props 
}) => {
  return (
    <div 
      className={`bg-[#181A20] ${noBorder ? '' : 'border border-[#2B313A]'} rounded-[6px] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface PanelHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
}) => {
  return (
    <div className={`px-4 py-3 border-b border-[#2B313A] flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <div className="flex items-center gap-2.5">
        <h3 className="text-sm font-semibold text-alphabag-text tracking-tight flex items-center gap-2">
          {title}
        </h3>
        {badge}
        {subtitle && (
          <span className="text-xs text-alphabag-subtext">{subtitle}</span>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

interface PanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const PanelBody: React.FC<PanelBodyProps> = ({ 
  children, 
  className = 'p-4',
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};
