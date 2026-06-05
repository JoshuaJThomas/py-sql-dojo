let sqlJsPromise = null;

export function loadSqlJsInstance() {
  if (sqlJsPromise) return sqlJsPromise;

  sqlJsPromise = new Promise((resolve, reject) => {
    if (window.initSqlJs) {
      window.initSqlJs({
        locateFile: (filename) => `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${filename}`
      }).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.js";
    script.onload = () => {
      window.initSqlJs({
        locateFile: (filename) => `https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/${filename}`
      }).then(resolve).catch(reject);
    };
    script.onerror = () => {
      reject(new Error("Failed to load SQL.js from CDN."));
    };
    document.head.appendChild(script);
  });

  return sqlJsPromise;
}

export async function runSqlQuery(seedSql, querySql) {
  const SQL = await loadSqlJsInstance();
  const db = new SQL.Database();

  let error = null;
  let success = false;
  let result = null;

  try {
    // 1. Run the database seed SQL
    db.run(seedSql);

    // 2. Run the user's query
    // Exec returns an array: [{columns: [...], values: [[...], ...]}]
    result = db.exec(querySql);
    success = true;
  } catch (err) {
    error = err.message;
    success = false;
  }

  // Retrieve full schema information
  let schema = {};
  try {
    const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    if (tablesResult.length > 0) {
      const tables = tablesResult[0].values
        .map(row => row[0])
        .filter(name => name !== 'sqlite_sequence');
      for (const table of tables) {
        const info = db.exec(`PRAGMA table_info(${table});`);
        if (info.length > 0) {
          schema[table] = info[0].values.map(row => ({
            cid: row[0],
            name: row[1],
            type: row[2],
            notnull: row[3],
            dflt_value: row[4],
            pk: row[5]
          }));
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch database schema: ", e);
  }

  // Export db values in case we want to show raw table data
  const getTableData = (tableName) => {
    try {
      return db.exec(`SELECT * FROM ${tableName}`);
    } catch (e) {
      return null;
    }
  };

  const dbState = {};
  Object.keys(schema).forEach(table => {
    dbState[table] = getTableData(table);
  });

  // Free memory
  db.close();

  return {
    success,
    result,
    error,
    schema,
    dbState
  };
}

export async function exportDatabase(seedSql, userQuerySql) {
  const SQL = await loadSqlJsInstance();
  const db = new SQL.Database();
  
  try {
    if (seedSql) db.run(seedSql);
    if (userQuerySql) {
      try {
        db.run(userQuerySql);
      } catch (e) {
        console.error("Error executing user query before export:", e);
      }
    }
    const binaryArray = db.export();
    db.close();
    return binaryArray;
  } catch (err) {
    db.close();
    throw err;
  }
}
