<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, drawSelection, lineNumbers } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { python } from '@codemirror/lang-python';
  import { sql } from '@codemirror/lang-sql';
  import { theme } from '../stores/dojo-store.js';

  let { value = $bindable(), language = 'python', onChange = null, fontSize = 14, wordWrap = true } = $props();

  let containerEl;
  let view;
  let isUpdating = false;

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
    if (view) {
      isUpdating = true;
      view.setState(createEditorState(value, language, fontSize, wordWrap, activeTheme === 'light'));
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
</style>
