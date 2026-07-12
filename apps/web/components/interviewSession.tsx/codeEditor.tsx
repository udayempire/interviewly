"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ChevronDown } from "lucide-react";

/** Languages available in the dropdown */
const LANGUAGES = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" },
    { value: "ruby", label: "Ruby" },
    { value: "sql", label: "SQL" },
] as const;

type SupportedLanguage = (typeof LANGUAGES)[number]["value"];

/** Default starter code per language */
const DEFAULT_CODE: Record<SupportedLanguage, string> = {
    javascript: '// Start coding here\nconsole.log("Hello, world!");\n',
    typescript: '// Start coding here\nconst greeting: string = "Hello, world!";\nconsole.log(greeting);\n',
    python: '# Start coding here\nprint("Hello, world!")\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, world!\\n");\n    return 0;\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, world!")\n}\n',
    rust: 'fn main() {\n    println!("Hello, world!");\n}\n',
    ruby: '# Start coding here\nputs "Hello, world!"\n',
    sql: '-- Start coding here\nSELECT * FROM users;\n',
};

interface CodeEditorProps {
    /** Callback when code changes — hook into this for backend sync later */
    onCodeChange?: (code: string, language: SupportedLanguage) => void;
}

export const CodeEditor = ({ onCodeChange }: CodeEditorProps) => {
    const [language, setLanguage] = useState<SupportedLanguage>("javascript");
    const [code, setCode] = useState(DEFAULT_CODE.javascript);

    const handleLanguageChange = (newLang: SupportedLanguage) => {
        setLanguage(newLang);
        const newCode = DEFAULT_CODE[newLang];
        setCode(newCode);
        onCodeChange?.(newCode, newLang);
    };

    const handleCodeChange = (value: string | undefined) => {
        const updated = value ?? "";
        setCode(updated);
        onCodeChange?.(updated, language);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
            {/* Toolbar with language selector */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
                <p className="text-sm font-semibold text-zinc-700">Code Editor</p>

                <div className="relative">
                    <select
                        value={language}
                        onChange={(e) =>
                            handleLanguageChange(e.target.value as SupportedLanguage)
                        }
                        className="appearance-none rounded-md border border-zinc-200 bg-zinc-50 py-1.5 pl-3 pr-8 text-sm font-medium text-zinc-700 outline-none transition-colors hover:bg-zinc-100 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                </div>
            </div>

            {/* Monaco editor */}
            <div className="flex-1 min-h-0">
                <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    options={{
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        fontSize: 15,
                        tabSize: 4,
                        wordWrap: "on",
                        lineNumbers: "on",
                        glyphMargin: false,
                        folding: false,
                        renderLineHighlight: "none",
                        contextmenu: false,
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        parameterHints: { enabled: false },
                        hover: { enabled: false },
                    }}
                    loading={
                        <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-zinc-400">Loading editor...</p>
                        </div>
                    }
                />
            </div>
        </div>
    );
};
