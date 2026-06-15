<script>
  import { onMount, onDestroy, untrack } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, drawSelection, lineNumbers } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { python } from '@codemirror/lang-python';
  import { sql } from '@codemirror/lang-sql';
  import { autocompletion } from '@codemirror/autocomplete';
  import { theme } from '../stores/dojo-store.js';

  let { value = $bindable(), language = 'python', onChange = null, fontSize = 14, wordWrap = true } = $props();

  // Custom Dojo autocompletions for Python and SQL
  const customPythonCompletions = [
    { label: 'def', type: 'keyword', detail: 'Define function' },
    { label: 'return', type: 'keyword', detail: 'Return statement' },
    { label: 'import numpy as np', type: 'keyword', detail: 'Import NumPy library' },
    { label: 'import pandas as pd', type: 'keyword', detail: 'Import Pandas library' },
    { label: 'np.array', type: 'function', detail: 'NumPy array creation' },
    { label: 'np.mean', type: 'function', detail: 'Calculate mean average' },
    { label: 'np.median', type: 'function', detail: 'Calculate median' },
    { label: 'pd.DataFrame', type: 'class', detail: 'Pandas DataFrame constructor' },
    { label: 'df.groupby', type: 'method', detail: 'Group DataFrame records' },
    { label: 'df.loc', type: 'property', detail: 'Label-based slicing' },
    { label: 'df.iloc', type: 'property', detail: 'Integer-based indexing' },
    { label: 'fizzbuzz', type: 'function', detail: 'FizzBuzz function' },
    { label: 'is_leap', type: 'function', detail: 'Leap year checker' },
    { label: 'result', type: 'variable', detail: 'Output target variable' },
    { label: 'scores', type: 'variable', detail: 'List of score integers' },
    { label: 'runner_up', type: 'variable', detail: 'Second highest score' },
    { label: 'print', type: 'function', detail: 'Print output to console' }
  ];

  const customSqlCompletions = [
    { label: 'SELECT', type: 'keyword', detail: 'Query selection projection' },
    { label: 'FROM', type: 'keyword', detail: 'Target table source' },
    { label: 'WHERE', type: 'keyword', detail: 'Row filtering condition' },
    { label: 'INNER JOIN', type: 'keyword', detail: 'Combine matching records' },
    { label: 'LEFT JOIN', type: 'keyword', detail: 'Combine with unmatched left rows' },
    { label: 'GROUP BY', type: 'keyword', detail: 'Partition results into aggregates' },
    { label: 'ORDER BY', type: 'keyword', detail: 'Sort returned rows' },
    { label: 'employees', type: 'keyword', detail: 'Employees Table' },
    { label: 'departments', type: 'keyword', detail: 'Departments Table' },
    { label: 'orders', type: 'keyword', detail: 'Orders Table' },
    { label: 'customers', type: 'keyword', detail: 'Customers Table' },
    { label: 'salary', type: 'property', detail: 'Salary Column' },
    { label: 'department', type: 'property', detail: 'Department Column' },
    { label: 'ROW_NUMBER() OVER', type: 'function', detail: 'Window Row Number' },
    { label: 'RANK() OVER', type: 'function', detail: 'Window Rank' }
  ];

  function getDojoCompletions(lang) {
    return (context) => {
      let word = context.matchBefore(/\w+/);
      if (!word || (word.from === word.to && !context.explicit)) return null;
      
      const list = lang === 'python' ? customPythonCompletions : customSqlCompletions;
      const text = word.text.toLowerCase();
      const options = list.filter(opt => opt.label.toLowerCase().includes(text));
      
      if (options.length === 0) return null;
      
      return {
        from: word.from,
        options: options
      };
    };
  }

  let containerEl;
  let view = $state(null);
  let isUpdating = $state(false);

  let activeTheme = $derived($theme);

  // Dynamic theme definitions for light & dark modes
  function createDojoTheme(isLight) {
    return EditorView.theme({
      "&": {
        color: isLight ? "#1e293b" : "#d4d4d4",
        backgroundColor: isLight ? "#f8fafc" : "#101014",
        fontFamily: "var(--font-mono)",
        height: "100%"
      },
      ".cm-content": {
        caretColor: isLight ? "#0f766e" : "#10b981",
        padding: "16px 0"
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: isLight ? "#0f766e" : "#10b981"
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
        backgroundColor: isLight ? "rgba(15, 118, 110, 0.15)" : "rgba(16, 185, 129, 0.2)"
      },
      ".cm-gutters": {
        backgroundColor: isLight ? "#f1f5f9" : "#0d0d11",
        color: isLight ? "#64748b" : "#4e4e5a",
        borderRight: `1px solid ${isLight ? '#e2e8f0' : '#1a1a24'}`,
        paddingLeft: "8px",
        paddingRight: "8px"
      },
      ".cm-gutterElement": {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end"
      },
      ".cm-activeLine": {
        backgroundColor: isLight ? "rgba(15, 118, 110, 0.03)" : "rgba(255, 255, 255, 0.02)"
      },
      ".cm-activeLineGutter": {
        backgroundColor: isLight ? "rgba(15, 118, 110, 0.05)" : "rgba(255, 255, 255, 0.04)",
        color: isLight ? "#0f766e" : "#d4d4d4"
      }
    }, { dark: !isLight });
  }

  function getLanguageExtension(lang) {
    if (lang === 'python') return python();
    if (lang === 'sql') return sql();
    return [];
  }

  function createEditorState(initialValue, lang, size, wrap, isLight) {
    return EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        getLanguageExtension(lang),
        createDojoTheme(isLight),
        autocompletion({ override: [getDojoCompletions(lang)] }),
        EditorView.theme({
          "&": {
            fontSize: `${size}px !important`
          }
        }),
        wrap ? EditorView.lineWrapping : [],
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdating) {
            const newValue = update.state.doc.toString();
            value = newValue;
            if (onChange) onChange(newValue);
          }
        })
      ]
    });
  }

  $effect(() => {
    // Reinitialize or update the document if the active challenge/language/value changes externally
    if (view && value !== view.state.doc.toString()) {
      isUpdating = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value }
      });
      isUpdating = false;
    }
  });

  $effect(() => {
    // Recreate the state if language, fontSize, wordWrap, or theme changes
    // We untrack the value so typing doesn't re-instantiate CodeMirror
    if (view) {
      isUpdating = true;
      const currentValue = untrack(() => value);
      view.setState(createEditorState(currentValue, language, fontSize, wordWrap, activeTheme === 'light'));
      isUpdating = false;
    }
  });

  onMount(() => {
    view = new EditorView({
      state: createEditorState(value, language, fontSize, wordWrap, activeTheme === 'light'),
      parent: containerEl
    });
  });

  onDestroy(() => {
    if (view) view.destroy();
  });
</script>

<div class="editor-wrapper" bind:this={containerEl}></div>

<style>
  .editor-wrapper {
    width: 100%;
    height: 100%;
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--color-hairline);
    background-color: var(--color-editor-bg);
  }
  
  :global(.cm-editor) {
    height: 100%;
  }

  /* Premium Autocomplete Tooltip Styles */
  :global(.cm-tooltip-autocomplete) {
    background-color: var(--color-canvas) !important;
    border: 1px solid var(--color-hairline) !important;
    border-radius: var(--radius-sm) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
    font-family: var(--font-mono) !important;
    font-size: 11px !important;
    padding: 4px 0 !important;
    max-height: 200px !important;
  }

  :global(.cm-tooltip-autocomplete ul) {
    max-height: 200px !important;
  }

  :global(.cm-tooltip-autocomplete ul li) {
    padding: 6px 12px !important;
    color: var(--color-muted) !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 16px !important;
  }

  :global(.cm-tooltip-autocomplete ul li[aria-selected]) {
    background-color: var(--color-accent-glow) !important;
    color: var(--color-primary) !important;
  }

  :global(.cm-completionInfo) {
    background-color: var(--color-canvas) !important;
    border: 1px solid var(--color-hairline) !important;
    color: var(--color-ink) !important;
    padding: 8px !important;
  }

  /* Completion details/types styles */
  :global(.cm-completionDetail) {
    font-style: italic !important;
    font-size: 9px !important;
    color: var(--color-muted) !important;
    opacity: 0.8 !important;
  }
</style>
