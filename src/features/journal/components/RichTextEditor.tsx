"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

/** Lightweight rich-text field — stores HTML in a hidden input named `body`. */
export function RichTextEditor({
  name = "body",
  defaultValue = "",
  label = "Entry",
  placeholder = "What happened in the bay…",
}: {
  name?: string;
  defaultValue?: string;
  label?: string;
  placeholder?: string;
}) {
  const id = useId();
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => {
    if (editorRef.current && defaultValue && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultValue;
    }
  }, [defaultValue]);

  const sync = useCallback(() => {
    const next = editorRef.current?.innerHTML ?? "";
    setHtml(next === "<br>" ? "" : next);
  }, []);

  function cmd(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function onInput(_e: FormEvent<HTMLDivElement>) {
    sync();
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-text-muted">
        {label}
      </label>
      <div className="mt-2 overflow-hidden border border-border bg-surface">
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          {(
            [
              ["bold", "B", () => cmd("bold")],
              ["italic", "I", () => cmd("italic")],
              ["ul", "• List", () => cmd("insertUnorderedList")],
              ["ol", "1. List", () => cmd("insertOrderedList")],
            ] as const
          ).map(([key, labelText, onClick]) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="px-2 py-1 text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
            >
              {labelText}
            </button>
          ))}
          <button
            type="button"
            className="px-2 py-1 text-xs text-text-muted transition-colors hover:bg-white/[0.04] hover:text-text"
            onClick={() => {
              const url = window.prompt("Link URL");
              if (url) cmd("createLink", url);
            }}
          >
            Link
          </button>
        </div>
        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          data-placeholder={placeholder}
          className="min-h-[160px] px-3 py-3 text-sm leading-relaxed text-text outline-none empty:before:pointer-events-none empty:before:text-text-muted empty:before:content-[attr(data-placeholder)]"
        />
      </div>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
