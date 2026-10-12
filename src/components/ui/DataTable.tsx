import React from 'react';

interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  children,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`w-full overflow-x-auto ${containerClassName}`}>
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`border-b border-[#2B313A] bg-[#14171D] ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'center' | 'right' }> = ({
  children,
  align = 'left',
  className = '',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={`py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-alphabag-subtext select-none ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-[#2B313A]/50 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { isHoverable?: boolean }> = ({
  children,
  isHoverable = true,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`transition-colors duration-150 ${isHoverable ? 'hover:bg-[#202630]' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'center' | 'right'; isNumeric?: boolean }> = ({
  children,
  align = 'left',
  isNumeric = false,
  className = '',
  ...props
}) => {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  const numClass = isNumeric ? 'num' : '';
  return (
    <td
      className={`py-3 px-3 text-xs text-alphabag-text whitespace-nowrap ${alignClass} ${numClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};
