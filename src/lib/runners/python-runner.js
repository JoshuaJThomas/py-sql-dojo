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
    // 1. Run the prelude code to define inputs (like nums, matrix, df, X, y)
    if (preludeCode) {
      await pyodide.runPythonAsync(preludeCode);
    }
    
    // 2. Run the user's code
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
    try:
        # Run the assertion in the global scope
        exec(c['test'], globals())
        __results_list__.append({"passed": True, "msg": c["msg"]})
    except Exception as e:
        __results_list__.append({"passed": False, "msg": c["msg"] + " (" + str(type(e).__name__) + ": " + str(e) + ")"})

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
