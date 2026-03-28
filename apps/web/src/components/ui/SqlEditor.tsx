import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  lineNumbers,
  placeholder,
  scrollPastEnd,
} from "@codemirror/view";
import { sql, PostgreSQL, MySQL, MSSQL } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { useAppStore } from "../../store/app.store";
import { CopyButton } from "./CopyButton";

type SqlDialect = "postgres" | "mysql" | "mssql";

interface SqlEditorProps {
  /** The SQL content to display */
  value: string;
  /** Callback when content changes (makes editor editable) */
  onChange?: (value: string) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** SQL dialect for syntax highlighting */
  dialect?: SqlDialect;
  /** Additional CSS classes for the container */
  className?: string;
  /** Filename to display in header */
  filename?: string;
  /** Placeholder text when empty */
  placeholderText?: string;
  /** Whether to show the reset button */
  showReset?: boolean;
  /** Callback when reset is clicked */
  onReset?: () => void;
  /** Whether the content has been modified from original */
  isModified?: boolean;
}

const dialectMap = {
  postgres: PostgreSQL,
  mysql: MySQL,
  mssql: MSSQL,
};

// Base theme that ensures proper scrolling behavior
const baseEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    maxHeight: "100%",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
});

// Custom light theme for CodeMirror
const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-surface-muted)",
      color: "var(--color-content-primary)",
    },
    ".cm-content": {
      caretColor: "var(--color-content-primary)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-content-primary)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "rgba(16, 185, 129, 0.2)",
      },
    ".cm-gutters": {
      backgroundColor: "var(--color-surface-muted)",
      color: "var(--color-content-muted)",
      borderRight: "1px solid var(--color-border)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--color-surface-subtle)",
    },
  },
  { dark: false },
);

// Light theme syntax highlighting
const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#d73a49" },
  { tag: tags.string, color: "#22863a" },
  { tag: tags.number, color: "#005cc5" },
  { tag: tags.comment, color: "#6a737d", fontStyle: "italic" },
  { tag: tags.typeName, color: "#6f42c1" },
  { tag: tags.variableName, color: "#24292e" },
  { tag: tags.definition(tags.variableName), color: "#6f42c1" },
  { tag: tags.propertyName, color: "#005cc5" },
  { tag: tags.operator, color: "#d73a49" },
  { tag: tags.punctuation, color: "#24292e" },
]);

const lightThemeExtension = [
  lightTheme,
  syntaxHighlighting(lightHighlightStyle),
];

/**
 * A CodeMirror-powered SQL editor with syntax highlighting and optional editing.
 * Features macOS-style header with traffic lights, copy button, and theme support.
 */
export const SqlEditor = ({
  value,
  onChange,
  readOnly = false,
  dialect = "postgres",
  className = "",
  filename = "schema.sql",
  placeholderText = "-- No SQL generated yet",
  showReset = false,
  onReset,
  isModified = false,
}: SqlEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const themeMode = useAppStore((state) => state.themeMode);

  // Keep onChange ref up to date to avoid stale closures
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const getDialect = useCallback(() => {
    return dialectMap[dialect] || PostgreSQL;
  }, [dialect]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const extensions = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      sql({ dialect: getDialect() }),
      themeMode === "dark" ? oneDark : lightThemeExtension,
      placeholder(placeholderText),
      scrollPastEnd(),
      baseEditorTheme, // Must be after other themes to ensure height is applied
      updateListener,
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [themeMode, dialect, readOnly, placeholderText, getDialect]); // Recreate on config changes

  // Update content when value prop changes externally (not from user typing)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      className={`flex flex-col overflow-hidden bg-surface-muted rounded-2xl border border-border ${
        themeMode === "dark" ? "sql-editor-dark" : "sql-editor-light"
      } ${className}`}
    >
      {/* macOS-style header */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 py-3 border-b border-border/70">
        <div className="flex items-center gap-2">
          {/* Traffic light buttons */}
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-sm text-content-secondary">
            {filename}
          </span>
          {isModified && (
            <span className="text-xs text-status-warning-text">(modified)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showReset && isModified && onReset && (
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              Reset
            </button>
          )}
          {value && <CopyButton text={value} />}
        </div>
      </div>

      {/* CodeMirror editor - use relative/absolute to ensure proper sizing */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={editorRef}
          className="sql-editor-wrapper absolute inset-0"
        />
      </div>
    </div>
  );
};
