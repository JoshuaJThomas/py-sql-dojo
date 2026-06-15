/**
 * Parses raw CSV content using standard RFC 4180 parsing rules.
 * Correctly handles commas inside quoted fields, double quotes, escaped quotes (""), and multiline values.
 */
function parseCsv(text) {
  const result = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r' || c === '\n') {
        row.push(field);
        field = '';
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          result.push(row);
        }
        row = [];
        if (c === '\r' && next === '\n') {
          i++; // skip LF after CR
        }
      } else {
        field += c;
      }
    }
  }
  
  if (field || inQuotes) {
    row.push(field);
  }
  if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
    result.push(row);
  }
  
  return result;
}

/**
 * Parses raw CSV content and generates SQL CREATE TABLE and INSERT INTO DDL queries.
 */
export function convertCsvToSql(tableName, csvText) {
  if (!tableName || !csvText) return "";
  const cleanTableName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanTableName) return "";
  
  const parsed = parseCsv(csvText);
  if (parsed.length === 0) return "";
  
  // Header row
  const headers = parsed[0].map(h => h.trim().replace(/[^a-zA-Z0-9_]/g, ''));
  if (headers.length === 0) return "";
  
  // CREATE TABLE statement
  let sql = `CREATE TABLE ${cleanTableName} (\n`;
  sql += headers.map(h => `  ${h} TEXT`).join(',\n');
  sql += `\n);\n\n`;
  
  // INSERT INTO statements
  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    // Allow padding/ignoring mismatched row columns but filter out completely malformed ones
    if (row.length !== headers.length) continue;
    
    const escapedValues = row.map(val => {
      // Escape single quotes for SQL insertion
      return "'" + val.replace(/'/g, "''") + "'";
    });
    sql += `INSERT INTO ${cleanTableName} (${headers.join(', ')}) VALUES (${escapedValues.join(', ')});\n`;
  }
  
  return sql;
}
