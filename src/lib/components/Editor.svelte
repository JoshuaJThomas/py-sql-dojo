<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, drawSelection, lineNumbers } from '@codemirror/view';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { python } from '@codemirror/lang-python';
  import { sql } from '@codemirror/lang-sql';

  let { value = $bindable(), language = 'python', onChange = null, fontSize = 14, wordWrap = true } = $props();

  let containerEl;
  let view;
  let isUpdating = false;

  const dojoTheme = EditorView.theme({
    "&": {
      color: "#d4d4d4",
      backgroundColor: "#101014",
      fontFamily: "var(--font-mono)",
      height: "100%"
    },
    ".cm-content": {
      caretColor: "#10b981",
      padding: "16px 0"
    },
    "&.cm-focused .cm-cursor": {
      borderLeftColor: "#10b981"
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(16, 185, 129, 0.2)"
    },
    ".cm-gutters": {
      backgroundColor: "#0d0d11",
      color: "#4e4e5a",
      borderRight: "1px solid #1a1a24",
      paddingLeft: "8px",
      paddingRight: "8px"
    },
    ".cm-gutterElement": {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end"
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(255, 255, 255, 0.02)"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      color: "#d4d4d4"
    }
  }, { dark: true });

  function getLanguageExtension(lang) {
    if (lang === 'python') return python();
    if (lang === 'sql') return sql();
    return [];
  }

  function createEditorState(initialValue, lang, size, wrap) {
    return EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        history(),
        drawSelection(),
        getLanguageExtension(lang),
        dojoTheme,
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
    // Recreate the state if language, fontSize, or wordWrap changes
    if (view) {
      isUpdating = true;
      view.setState(createEditorState(value, language, fontSize, wordWrap));
      isUpdating = false;
    }
  });

  onMount(() => {
    view = new EditorView({
      state: createEditorState(value, language, fontSize, wordWrap),
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
    border: 1px solid #1a1a24;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  }
  
  :global(.cm-editor) {
    height: 100%;
  }
</style>
