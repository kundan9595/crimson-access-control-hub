
export interface ExportConfig {
  filename: string;
  headers: string[];
  data: any[];
  fieldMap: Record<string, string | ((item: any) => string)>;
}

export const exportToCSV = ({ filename, headers, data, fieldMap }: ExportConfig) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const csvRows = [
    headers.join(','),
    ...data.map(item => 
      headers.map(header => {
        const fieldMapper = fieldMap[header];
        if (typeof fieldMapper === 'function') {
          return `"${fieldMapper(item)}"`;
        }
        if (typeof fieldMapper === 'string') {
          const value = item[fieldMapper];
          if (value === null || value === undefined) return '""';
          if (typeof value === 'string') return `"${value}"`;
          return `"${value}"`;
        }
        return '""';
      }).join(',')
    )
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateExportFilename = (entityName: string) => {
  const date = new Date().toISOString().split('T')[0];
  return `${entityName.toLowerCase()}-${date}.csv`;
};
