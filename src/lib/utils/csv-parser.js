/**
 * Parses raw CSV content and generates SQL CREATE TABLE and INSERT INTO DDL queries.
 */
export function convertCsvToSql(tableName, csvText) {
  if (!tableName || !csvText) return "";
  const cleanTableName = tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanTableName) return "";
  
  const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  
  // Header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/[^a-zA-Z0-9_]/g, ''));
  if (headers.length === 0) return "";
  
  // CREATE TABLE statement
  let sql = `CREATE TABLE ${cleanTableName} (\n`;
  sql += headers.map(h => `  ${h} TEXT`).join(',\n');
  sql += `\n);\n\n`;
  
  // INSERT INTO statements
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.trim());
    if (row.length !== headers.length) continue;
    
    const escapedValues = row.map(val => {
      // Escape single quotes for SQL insertion
      return "'" + val.replace(/'/g, "''") + "'";
    });
    sql += `INSERT INTO ${cleanTableName} (${headers.join(', ')}) VALUES (${escapedValues.join(', ')});\n`;
  }
  
  return sql;
}
