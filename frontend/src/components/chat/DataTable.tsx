import React from 'react';

interface DataTableProps {
  children?: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ children }) => {
  return (
    <div className="my-3.5 w-full overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-sm">
      <table className="w-full text-left text-xs border-collapse font-sans">
        {children}
      </table>
    </div>
  );
};
