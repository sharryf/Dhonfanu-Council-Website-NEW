"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Eraser, Heading2, Heading3, Italic, Link as LinkIcon, List, ListOrdered, Quote, Underline } from "lucide-react";

/**
 * Lightweight rich-text editor for news articles (no external dependency).
 * The HTML is posted through a hidden input and sanitised on the server.
 */
export function RichText({ label, name, defaultValue = "", dv = false }: { label: string; name: string; defaultValue?: string; dv?: boolean }) {
  const editor = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);

  useEffect(() => {
    if (editor.current) editor.current.innerHTML = defaultValue;
    // Initial content only — the editor is uncontrolled afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => setHtml(editor.current?.innerHTML ?? "");

  function run(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addLink() {
    const url = window.prompt("Link address (https://…)");
    if (!url) return;
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
      window.alert("Links must start with https://, http://, mailto: or tel:");
      return;
    }
    run("createLink", url);
  }

  const tools = [
    { icon: Bold, title: "Bold", onClick: () => run("bold") },
    { icon: Italic, title: "Italic", onClick: () => run("italic") },
    { icon: Underline, title: "Underline", onClick: () => run("underline") },
    { icon: Heading2, title: "Heading", onClick: () => run("formatBlock", "h2") },
    { icon: Heading3, title: "Sub-heading", onClick: () => run("formatBlock", "h3") },
    { icon: List, title: "Bulleted list", onClick: () => run("insertUnorderedList") },
    { icon: ListOrdered, title: "Numbered list", onClick: () => run("insertOrderedList") },
    { icon: Quote, title: "Quote", onClick: () => run("formatBlock", "blockquote") },
    { icon: LinkIcon, title: "Add link", onClick: addLink },
    {
      icon: Eraser,
      title: "Clear formatting",
      onClick: () => {
        run("removeFormat");
        run("formatBlock", "p");
      },
    },
  ];

  return (
    <div>
      <p className="label" id={`rt-${name}-label`}>
        {label}
      </p>
      <div className="overflow-hidden rounded-xl border border-navy/10 bg-white focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/20">
        <div className="flex flex-wrap gap-0.5 border-b border-navy/10 bg-canvas p-1.5" role="toolbar" aria-label="Formatting">
          {tools.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={tool.onClick}
              className="flex size-8 items-center justify-center rounded-lg text-navy/70 hover:bg-aqua hover:text-navy"
            >
              <tool.icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div
          ref={editor}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`rt-${name}-label`}
          dir={dv ? "rtl" : "ltr"}
          lang={dv ? "dv" : "en"}
          onInput={sync}
          onBlur={sync}
          onPaste={(e) => {
            // Paste as plain text so copied Word/web styling does not leak in.
            e.preventDefault();
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }}
          className="prose-civic min-h-56 px-4 py-3 text-base focus:outline-none"
        />
      </div>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
