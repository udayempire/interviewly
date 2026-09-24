"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

const LANGUAGES = ["javascript", "typescript", "python", "java", "cpp", "c", "go", "rust", "ruby", "sql"] as const;
type SupportedLanguage = (typeof LANGUAGES)[number];
const DEFAULT_CODE: Record<SupportedLanguage, string> = { javascript: "// Start coding here\nconsole.log(\"Hello, world!\");\n", typescript: "// Start coding here\nconst greeting: string = \"Hello, world!\";\nconsole.log(greeting);\n", python: "# Start coding here\nprint(\"Hello, world!\")\n", java: "public class Main {\n}\n", cpp: "#include <iostream>\n\nint main() {}\n", c: "#include <stdio.h>\n\nint main() {}\n", go: "package main\n", rust: "fn main() {}\n", ruby: "puts \"Hello, world!\"\n", sql: "SELECT * FROM users;\n" };

export const CodeEditor = () => {
  const [language, setLanguage] = useState<SupportedLanguage>("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const { resolvedTheme } = useTheme();
  return <section className="flex h-full min-h-80 flex-col overflow-hidden border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><header className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-zinc-800"><h2 className="text-sm font-semibold text-stone-900 dark:text-zinc-100">Code editor</h2><div className="relative"><select value={language} onChange={(event) => { const next = event.target.value as SupportedLanguage; setLanguage(next); setCode(DEFAULT_CODE[next]); }} className="appearance-none border border-stone-300 bg-stone-50 py-1.5 pl-3 pr-8 text-xs font-medium text-stone-700 outline-none focus:border-amber-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"><option value={language}>{language}</option>{LANGUAGES.filter((item) => item !== language).map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" /></div></header><div className="min-h-0 flex-1"><Editor height="100%" language={language} theme={resolvedTheme === "dark" ? "vs-dark" : "light"} value={code} onChange={(value) => setCode(value ?? "")} options={{ minimap: { enabled: false }, automaticLayout: true, scrollBeyondLastLine: false, fontSize: 14, tabSize: 4, wordWrap: "on", glyphMargin: false, folding: false, renderLineHighlight: "none", contextmenu: false }} /></div></section>;
};
