let worker = null;
let workerInitPromise = null;
let nextMessageId = 0;
const pendingPromises = new Map();

function createSqlWorker() {
  const workerCode = `
    let sqlJsPromise = null;
    let SQL = null;
    let notebookDb = null;

    importScripts("https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/sql-wasm.js");

    async function loadSqlJsInstance() {
      if (sqlJsPromise) return sqlJsPromise;
      sqlJsPromise = self.initSqlJs({
        locateFile: (filename) => \`https://cdn.jsdelivr.net/npm/sql.js@1.14.0/dist/\${filename}\`
      }).then(instance => {
        SQL = instance;
        return SQL;
      });
      return sqlJsPromise;
    }

    function resetNotebookDatabase() {
      if (notebookDb) {
        try {
          notebookDb.close();
        } catch (e) {
          console.error("Error closing notebook database in worker: ", e);
        }
        notebookDb = null;
      }
    }

    self.onmessage = async (e) => {
      const { type, id, seedSql, querySql, userQuerySql, forceReset } = e.data;

      if (type === 'init') {
        try {
          await loadSqlJsInstance();
          self.postMessage({ type: 'init_ok', id });
        } catch (err) {
          self.postMessage({ type: 'init_err', id, error: err.message });
        }
        return;
      }

      try {
        const sqlInst = await loadSqlJsInstance();

        if (type === 'runSqlQuery') {
          const db = new sqlInst.Database();
          let error = null;
          let success = false;
          let result = null;

          try {
            db.run(seedSql);
            result = db.exec(querySql);
            success = true;
          } catch (err) {
            error = err.message;
            success = false;
          }

          let schema = {};
          try {
            const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
            if (tablesResult.length > 0) {
              const tables = tablesResult[0].values
                .map(row => row[0])
                .filter(name => name !== 'sqlite_sequence');
              for (const table of tables) {
                const info = db.exec(\`PRAGMA table_info("\${table.replace(/"/g, '""')}");\`);
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
            console.error("Failed to fetch schema in SQL worker:", e);
          }

          const getTableData = (tableName) => {
            try {
              return db.exec(\`SELECT * FROM "\${tableName.replace(/"/g, '""')}"\`);
            } catch (e) {
              return null;
            }
          };

          const dbState = {};
          Object.keys(schema).forEach(table => {
            dbState[table] = getTableData(table);
          });

          db.close();

          self.postMessage({
            type: 'runSqlQuery_res',
            id,
            success,
            result,
            error,
            schema,
            dbState
          });

        } else if (type === 'exportDatabase') {
          const db = new sqlInst.Database();
          let binaryArray = null;
          let error = null;
          try {
            if (seedSql) db.run(seedSql);
            if (userQuerySql) {
              try {
                db.run(userQuerySql);
              } catch (e) {
                console.error("Error executing user query before export in worker:", e);
              }
            }
            binaryArray = db.export();
            db.close();
            self.postMessage({
              type: 'exportDatabase_res',
              id,
              success: true,
              binaryArray
            });
          } catch (err) {
            db.close();
            self.postMessage({
              type: 'exportDatabase_res',
              id,
              success: false,
              error: err.message
            });
          }

        } else if (type === 'resetNotebookDatabase') {
          resetNotebookDatabase();
          self.postMessage({
            type: 'resetNotebookDatabase_res',
            id,
            success: true
          });

        } else if (type === 'runNotebookSqlQuery') {
          if (!notebookDb || forceReset) {
            resetNotebookDatabase();
            notebookDb = new sqlInst.Database();
            if (seedSql) {
              try {
                notebookDb.run(seedSql);
              } catch (e) {
                console.error("Error running seed SQL in notebook database worker:", e);
              }
            }
          }

          let error = null;
          let success = false;
          let result = null;

          try {
            result = notebookDb.exec(querySql);
            success = true;
          } catch (err) {
            error = err.message;
            success = false;
          }

          let schema = {};
          try {
            const tablesResult = notebookDb.exec("SELECT name FROM sqlite_master WHERE type='table';");
            if (tablesResult.length > 0) {
              const tables = tablesResult[0].values
                .map(row => row[0])
                .filter(name => name !== 'sqlite_sequence');
              for (const table of tables) {
                const info = notebookDb.exec(\`PRAGMA table_info("\${table.replace(/"/g, '""')}");\`);
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
            console.error("Failed to fetch notebook schema in SQL worker:", e);
          }

          const getTableData = (tableName) => {
            try {
              return notebookDb.exec(\`SELECT * FROM "\${tableName.replace(/"/g, '""')}"\`);
            } catch (e) {
              return null;
            }
          };

          const dbState = {};
          Object.keys(schema).forEach(table => {
            dbState[table] = getTableData(table);
          });

          self.postMessage({
            type: 'runNotebookSqlQuery_res',
            id,
            success,
            result,
            error,
            schema,
            dbState
          });
        }
      } catch (err) {
        self.postMessage({
          type: 'error',
          id,
          error: err.message
        });
      }
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const w = new Worker(workerUrl);

  w.onmessage = (e) => {
    const { type, id, error, success, result, schema, dbState, binaryArray } = e.data;
    const pending = pendingPromises.get(id);
    if (!pending) return;

    if (type === 'init_ok') {
      pending.resolve();
      pendingPromises.delete(id);
    } else if (type === 'init_err') {
      pending.reject(new Error(error));
      pendingPromises.delete(id);
    } else if (type === 'runSqlQuery_res') {
      pending.resolve({
        success,
        result,
        error,
        schema,
        dbState
      });
      pendingPromises.delete(id);
    } else if (type === 'exportDatabase_res') {
      if (success) {
        pending.resolve(binaryArray);
      } else {
        pending.reject(new Error(error));
      }
      pendingPromises.delete(id);
    } else if (type === 'resetNotebookDatabase_res') {
      pending.resolve();
      pendingPromises.delete(id);
    } else if (type === 'runNotebookSqlQuery_res') {
      pending.resolve({
        success,
        result,
        error,
        schema,
        dbState
      });
      pendingPromises.delete(id);
    } else if (type === 'error') {
      pending.reject(new Error(error));
      pendingPromises.delete(id);
    }
  };

  return w;
}

export function loadSqlJsInstance() {
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = new Promise((resolve, reject) => {
    try {
      worker = createSqlWorker();
      const id = nextMessageId++;
      pendingPromises.set(id, { resolve, reject });
      worker.postMessage({ type: 'init', id });
    } catch (err) {
      reject(err);
    }
  });

  return workerInitPromise;
}

export async function runSqlQuery(seedSql, querySql) {
  await loadSqlJsInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'runSqlQuery',
      id,
      seedSql,
      querySql
    });
  });
}

export async function exportDatabase(seedSql, userQuerySql) {
  await loadSqlJsInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'exportDatabase',
      id,
      seedSql,
      userQuerySql
    });
  });
}

export async function resetNotebookDatabase() {
  await loadSqlJsInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'resetNotebookDatabase',
      id
    });
  });
}

export async function runNotebookSqlQuery(seedSql, querySql, forceReset = false) {
  await loadSqlJsInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'runNotebookSqlQuery',
      id,
      seedSql,
      querySql,
      forceReset
    });
  });
}
