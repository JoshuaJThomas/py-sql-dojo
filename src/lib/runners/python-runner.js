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

export async function runPythonCode(code, checkAsserts, context = {}) {
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

  // Inject context variables (e.g. list variables like nums, scores or dataframes like df)
  for (const [key, value] of Object.entries(context)) {
    // If it's a pandas DataFrame, we can load pandas and create it in Pyodide
    if (value && typeof value === 'object' && !Array.isArray(value) && value.columns && value.data) {
      await pyodide.loadPackage("pandas");
      const jsonStr = JSON.stringify(value);
      pyodide.runPython(`import pandas as pd; import json; ${key} = pd.read_json(json.dumps(${jsonStr}))`);
    } else if (Array.isArray(value)) {
      // Inject array/list
      pyodide.globals.set(key, pyodide.toPy(value));
    } else {
      pyodide.globals.set(key, value);
    }
  }

  let error = null;
  let success = false;

  try {
    // Run the main solution code
    await pyodide.runPythonAsync(code);
    success = true;
  } catch (err) {
    error = err.message;
    success = false;
  }

  // If code executed without syntax error, run checks
  let checksPassed = false;
  let checkError = null;

  if (success && checkAsserts) {
    try {
      // Run the check block (assertion checks)
      await pyodide.runPythonAsync(checkAsserts);
      checksPassed = true;
    } catch (err) {
      checkError = err.message;
      checksPassed = false;
    }
  }

  return {
    success,
    stdout: stdoutContent,
    error,
    checksPassed,
    checkError
  };
}
