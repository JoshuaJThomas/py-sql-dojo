let worker = null;
let workerInitPromise = null;
let nextMessageId = 0;
const pendingPromises = new Map();

function createPythonWorker() {
  const workerCode = `
    let pyodidePromise = null;
    let pyodide = null;

    importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

    async function loadPyodideInstance() {
      if (pyodidePromise) return pyodidePromise;
      pyodidePromise = self.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      }).then(instance => {
        pyodide = instance;
        return pyodide;
      });
      return pyodidePromise;
    }

    self.onmessage = async (e) => {
      const { type, id, preludeCode, code, checks } = e.data;

      if (type === 'init') {
        try {
          await loadPyodideInstance();
          self.postMessage({ type: 'init_ok', id });
        } catch (err) {
          self.postMessage({ type: 'init_err', id, error: err.message });
        }
        return;
      }

      try {
        const py = await loadPyodideInstance();

        if (type === 'runPythonCode') {
          py.globals.clear();

          let stdoutContent = "";
          py.setStdout({
            write: (text) => {
              stdoutContent += text;
              return text.length;
            }
          });

          let error = null;
          let success = false;

          try {
            if (preludeCode) {
              await py.loadPackagesFromImports(preludeCode);
              await py.runPythonAsync(preludeCode);
            }
            
            await py.loadPackagesFromImports(code);
            await py.runPythonAsync(code);
            success = true;
          } catch (err) {
            error = err.message;
            success = false;
          } finally {
            try {
              py.setStdout({ write: () => {} });
            } catch (e) {}
          }

          let checksResults = [];
          let checksPassed = true;

          if (success && checks && checks.length > 0) {
            try {
              py.globals.set("__checks_json_str__", JSON.stringify(checks));
              const evaluatorCode = \`
import json
__checks_list__ = json.loads(__checks_json_str__)
__results_list__ = []

for c in __checks_list__:
    test_str = c['test']
    actual_val = None
    has_actual = False
    expected_val = None
    has_expected = False
    
    if "==" in test_str:
        try:
            lhs, rhs = test_str.split("==", 1)
            compile(lhs.strip(), '<string>', 'eval')
            e_val = eval(rhs.strip(), globals())
            expected_val = repr(e_val)
            has_expected = True
        except:
            pass

    try:
        try:
            val = eval(test_str, globals())
            if hasattr(val, 'any'):
                if not val.any():
                    raise AssertionError("Assertion evaluated to False")
            elif not val:
                raise AssertionError("Assertion evaluated to False")
        except SyntaxError:
            exec(test_str, globals())
            
        __results_list__.append({
            "passed": True, 
            "msg": c["msg"]
        })
    except Exception as e:
        if "==" in test_str:
            try:
                lhs, rhs = test_str.split("==", 1)
                compile(lhs.strip(), '<string>', 'eval')
                a_val = eval(lhs.strip(), globals())
                if callable(a_val):
                    actual_val = f"<function {a_val.__name__}>"
                else:
                    actual_val = repr(a_val)
                has_actual = True
            except:
                pass
        
        if not has_actual:
            try:
                if "result" in globals():
                    actual_val = repr(globals()["result"])
                    has_actual = True
            except:
                pass

        __results_list__.append({
            "passed": False, 
            "msg": c["msg"],
            "error_type": type(e).__name__,
            "error_detail": str(e),
            "actual": actual_val,
            "has_actual": has_actual,
            "expected": expected_val,
            "has_expected": has_expected
        })

__results_json__ = json.dumps(__results_list__)
\`;
              await py.runPythonAsync(evaluatorCode);
              const resultsJson = py.globals.get("__results_json__");
              checksResults = JSON.parse(resultsJson);
              checksPassed = checksResults.every(r => r.passed);
            } catch (err) {
              checksPassed = false;
              checksResults = [{ passed: false, msg: \\\`Dojo Test Harness Error: \\\${err.message}\\\` }];
            }
          }

          self.postMessage({
            type: 'runPythonCode_res',
            id,
            success,
            stdout: stdoutContent,
            error,
            checksPassed,
            checksResults
          });

        } else if (type === 'runPythonCell') {
          let stdoutContent = "";
          py.setStdout({
            write: (text) => {
              stdoutContent += text;
              return text.length;
            }
          });

          let error = null;
          let success = false;
          let resultRepr = "";
          let result = null;

          try {
            await py.loadPackagesFromImports(code);
            result = await py.runPythonAsync(code);
            success = true;
            if (result !== undefined && result !== null) {
              if (typeof result.toJs === 'function') {
                try {
                  resultRepr = JSON.stringify(result.toJs(), null, 2);
                } catch (e) {
                  resultRepr = String(result);
                }
              } else {
                resultRepr = String(result);
              }
            }
          } catch (err) {
            error = err.message;
            success = false;
          } finally {
            if (result && typeof result.destroy === 'function') {
              result.destroy();
            }
            try {
              py.setStdout({ write: () => {} });
            } catch (e) {}
          }

          self.postMessage({
            type: 'runPythonCell_res',
            id,
            success,
            stdout: stdoutContent,
            error,
            resultRepr
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
    const { type, id, error, success, stdout, checksPassed, checksResults, resultRepr } = e.data;
    const pending = pendingPromises.get(id);
    if (!pending) return;

    if (type === 'init_ok') {
      pending.resolve();
      pendingPromises.delete(id);
    } else if (type === 'init_err') {
      pending.reject(new Error(error));
      pendingPromises.delete(id);
    } else if (type === 'runPythonCode_res') {
      pending.resolve({
        success,
        stdout,
        error,
        checksPassed,
        checksResults
      });
      pendingPromises.delete(id);
    } else if (type === 'runPythonCell_res') {
      pending.resolve({
        success,
        stdout,
        error,
        resultRepr
      });
      pendingPromises.delete(id);
    } else if (type === 'error') {
      pending.reject(new Error(error));
      pendingPromises.delete(id);
    }
  };

  return w;
}

export function loadPyodideInstance() {
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = new Promise((resolve, reject) => {
    try {
      worker = createPythonWorker();
      const id = nextMessageId++;
      pendingPromises.set(id, { resolve, reject });
      worker.postMessage({ type: 'init', id });
    } catch (err) {
      reject(err);
    }
  });

  return workerInitPromise;
}

export async function runPythonCode(preludeCode, code, checks = []) {
  await loadPyodideInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'runPythonCode',
      id,
      preludeCode,
      code,
      checks
    });
  });
}

export async function runPythonCell(code) {
  await loadPyodideInstance();
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pendingPromises.set(id, { resolve, reject });
    worker.postMessage({
      type: 'runPythonCell',
      id,
      code
    });
  });
}
