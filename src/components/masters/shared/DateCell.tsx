import React from 'react';

interface DateCellProps {
  date?: string | Date;
  format?: 'short' | 'medium' | 'long' | 'full';
  showTime?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}

const formatDate = (
  date: string | Date,
  format: 'short' | 'medium' | 'long' | 'full',
  showTime: boolean
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '-';
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'short' : 'long',
    day: 'numeric',
  };

  if (showTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', dateOptions);
};

export const DateCell: React.FC<DateCellProps> = ({
  date,
  format = 'short',
  showTime = false,
  fallback = <span className="text-muted-foreground text-sm">-</span>,
  className = '',
}) => {
  if (!date) {
    return <>{fallback}</>;
  }

  const formatted = formatDate(date, format, showTime);

  if (formatted === '-') {
    return <>{fallback}</>;
  }

  return <span className={className}>{formatted}</span>;
};

interface DateRangeCellProps {
  startDate?: string | Date;
  endDate?: string | Date;
  format?: 'short' | 'medium' | 'long' | 'full';
  className?: string;
}

export const DateRangeCell: React.FC<DateRangeCellProps> = ({
  startDate,
  endDate,
  format = 'short',
  className = '',
}) => {
  if (!startDate && !endDate) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const formattedStart = startDate
    ? formatDate(startDate, format, false)
    : null;
  const formattedEnd = endDate ? formatDate(endDate, format, false) : null;

  return (
    <span className={className}>
      {formattedStart && formattedEnd ? (
        <>
          {formattedStart} - {formattedEnd}
        </>
      ) : formattedStart ? (
        <>
          From {formattedStart}
        </>
      ) : formattedEnd ? (
        <>
          Until {formattedEnd}
        </>
      ) : (
        '-'
      )}
    </span>
  );
};
