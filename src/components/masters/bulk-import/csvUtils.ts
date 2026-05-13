/** Escape a single CSV field per RFC 4180 (quotes, commas, newlines). */
export const escapeCsvCell = (value: string | number | null | undefined): string => {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const parseCSV = (csv: string): string[][] => {
  const lines = csv.trim().split('\n');
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  });
};

export const createCSVContent = (headers: string[], data: string[][]): string => {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(',');
  const bodyLines = data.map((row) => row.map((cell) => escapeCsvCell(cell)).join(','));
  return [headerLine, ...bodyLines].join('\n');
};

export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
