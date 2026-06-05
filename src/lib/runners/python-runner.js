let pyodidePromise = null;

export function loadPyodideInstance() {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      }).then(resolve).catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
    script.onload = () => {
      window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/"
      }).then(resolve).catch(reject);
    };
    script.onerror = () => {
      reject(new Error("Failed to load Pyodide from CDN."));
    };
    document.head.appendChild(script);
  });

  return pyodidePromise;
}

export async function runPythonCode(preludeCode, code, checks = []) {
  const pyodide = await loadPyodideInstance();

  // Reset globals/variables in the pyodide namespace
  pyodide.globals.clear();

  // Set up sys.stdout capture
  let stdoutContent = "";
  pyodide.setStdout({
    write: (text) => {
      stdoutContent += text;
      return text.length;
    }
  });

  let error = null;
  let success = false;

  try {
    // 1. Load packages from imports and run the prelude code to define inputs (like nums, matrix, df, X, y)
    if (preludeCode) {
      await pyodide.loadPackagesFromImports(preludeCode);
      await pyodide.runPythonAsync(preludeCode);
    }
    
    // 2. Load packages from user imports and run user code
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code);
    success = true;
  } catch (err) {
    error = err.message;
    success = false;
  }

  // 3. Evaluate each check assertion individually
  let checksResults = [];
  let checksPassed = true;

  if (success && checks.length > 0) {
    try {
      // Inject checks array as a JSON string to Pyodide
      pyodide.globals.set("__checks_json_str__", JSON.stringify(checks));
      
      const evaluatorCode = `
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
            e_val = eval(rhs.strip(), globals())
            expected_val = repr(e_val)
            has_expected = True
        except:
            pass

    try:
        # Run the assertion in the global scope
        exec(test_str, globals())
        __results_list__.append({
            "passed": True, 
            "msg": c["msg"]
        })
    except Exception as e:
        if "==" in test_str:
            try:
                lhs, rhs = test_str.split("==", 1)
                a_val = eval(lhs.strip(), globals())
                if callable(a_val):
                    actual_val = f"<function {a_val.__name__}>"
                else:
                    actual_val = repr(a_val)
                has_actual = True
            except Exception as eval_err:
                actual_val = f"<Error evaluating output: {type(eval_err).__name__}>"
                has_actual = True
        
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
`;
      await pyodide.runPythonAsync(evaluatorCode);
      
      const resultsJson = pyodide.globals.get("__results_json__");
      checksResults = JSON.parse(resultsJson);
      checksPassed = checksResults.every(r => r.passed);
    } catch (err) {
      console.error("Dojo check runner failed: ", err);
      checksPassed = false;
      checksResults = [{ passed: false, msg: `Dojo Test Harness Error: ${err.message}` }];
    }
  }

  return {
    success,
    stdout: stdoutContent,
    error,
    checksPassed,
    checksResults
  };
}

export async function runPythonCell(code) {
  const pyodide = await loadPyodideInstance();
  let stdoutContent = "";
  pyodide.setStdout({
    write: (text) => {
      stdoutContent += text;
      return text.length;
    }
  });

  let error = null;
  let success = false;
  let resultRepr = "";

  try {
    await pyodide.loadPackagesFromImports(code);
    const result = await pyodide.runPythonAsync(code);
    success = true;
    if (result !== undefined && result !== null) {
      // If it is a PyProxy (e.g. DataFrame, Array), convert to string/JSON or representation
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
  }

  return {
    success,
    stdout: stdoutContent,
    error,
    resultRepr
  };
}

