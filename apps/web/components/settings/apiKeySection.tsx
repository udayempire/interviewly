"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Key, Loader2, Check, Trash2, Zap, Info, ChevronDown, ShieldCheck, Copy } from "lucide-react"

// Only show providers that are actually implemented in packages/llm
const LLM_PROVIDERS = [
    {
        id: "gemini",
        name: "Google Gemini",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 0C12 6.627 17.373 12 24 12C17.373 12 12 17.373 12 24C12 17.373 6.627 12 0 12C6.627 12 12 6.627 12 0Z" fill="url(#gemini-grad)" />
                <defs>
                    <linearGradient id="gemini-grad" x1="0" y1="0" x2="24" y2="24">
                        <stop stopColor="#4285F4" />
                        <stop offset="0.5" stopColor="#9B72CB" />
                        <stop offset="1" stopColor="#D96570" />
                    </linearGradient>
                </defs>
            </svg>
        ),
        placeholder: "AIza...",
        helpUrl: "https://aistudio.google.com/apikey",
    },
    {
        id: "groq",
        name: "Groq",
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#F55036" />
                <path d="M7 8h4v8H7V8zm6 0h4v8h-4V8z" fill="white" />
            </svg>
        ),
        placeholder: "gsk_...",
        helpUrl: "https://console.groq.com/keys",
    },
]

interface ApiKeySectionProps {
    savedProvider?: string | null
    hasApiKey?: boolean
    useCustomKey?: boolean
}

export function ApiKeySection({
    savedProvider,
    hasApiKey = false,
    useCustomKey: initialUseCustomKey = false,
}: ApiKeySectionProps) {
    const [selectedProvider, setSelectedProvider] = useState(savedProvider || "")
    const [apiKey, setApiKey] = useState("")
    const [showKey, setShowKey] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isRemoving, setIsRemoving] = useState(false)

    // Custom API Key Toggle state
    const [useCustomKey, setUseCustomKey] = useState(initialUseCustomKey)
    const [isToggling, setIsToggling] = useState(false)
    const [toggleResult, setToggleResult] = useState<{ success: boolean; message: string } | null>(null)

    // Saved Key Reveal state
    const [isKeyRevealed, setIsKeyRevealed] = useState(false)
    const [revealedKey, setRevealedKey] = useState<string | null>(null)
    const [isFetchingKey, setIsFetchingKey] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedProviderInfo = LLM_PROVIDERS.find((p) => p.id === selectedProvider)

    useEffect(() => {
        setUseCustomKey(initialUseCustomKey)
    }, [initialUseCustomKey])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const getApiUrl = (endpoint: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        const version = process.env.NEXT_PUBLIC_API_VERSION || "api/v1"
        if (baseUrl.includes("/api/v1")) {
            return `${baseUrl}/user/${endpoint}`
        }
        return `${baseUrl}/${version}/user/${endpoint}`
    }

    const handleTestKey = async () => {
        if (!apiKey || !selectedProvider) return
        setIsTesting(true)
        setTestResult(null)

        try {
            const res = await fetch(getApiUrl("api-key/validate"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ llmProvider: selectedProvider, llmApiKey: apiKey }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setTestResult({ success: true, message: "API key is valid and working!" })
            } else {
                setTestResult({ success: false, message: data.error || "Invalid API key" })
            }
        } catch {
            setTestResult({ success: false, message: "Failed to test key. Please try again." })
        } finally {
            setIsTesting(false)
        }
    }

    const handleSave = async () => {
        if (!apiKey || !selectedProvider) return
        setIsSaving(true)
        setSaveResult(null)

        try {
            const res = await fetch(getApiUrl("api-key"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ llmProvider: selectedProvider, llmApiKey: apiKey }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setSaveResult({ success: true, message: "API key saved successfully!" })
                setApiKey("")
                setRevealedKey(null)
                setIsKeyRevealed(false)
            } else {
                setSaveResult({ success: false, message: data.error || "Failed to save API key" })
            }
        } catch {
            setSaveResult({ success: false, message: "Failed to save. Please try again." })
        } finally {
            setIsSaving(false)
        }
    }

    const handleRemoveKey = async () => {
        setIsRemoving(true)
        setSaveResult(null)

        try {
            const res = await fetch(getApiUrl("api-key"), {
                method: "DELETE",
                credentials: "include",
            })
            if (res.ok) {
                setSaveResult({ success: true, message: "API key removed. Using default platform key." })
                setSelectedProvider("")
                setApiKey("")
                setUseCustomKey(false)
                setRevealedKey(null)
                setIsKeyRevealed(false)
            }
        } catch {
            setSaveResult({ success: false, message: "Failed to remove key." })
        } finally {
            setIsRemoving(false)
        }
    }

    const handleToggleKeyUsage = async () => {
        setIsToggling(true)
        setToggleResult(null)
        const targetState = !useCustomKey

        try {
            const res = await fetch(getApiUrl("api-key/toggle"), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ useCustomKey: targetState }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                const nextVal = typeof data.useCustomKey === "boolean" ? data.useCustomKey : targetState
                setUseCustomKey(nextVal)
                setToggleResult({
                    success: true,
                    message: nextVal ? "Custom API key usage enabled." : "Switched to platform default key.",
                })
            } else {
                setToggleResult({ success: false, message: data.error || "Failed to toggle key usage" })
            }
        } catch {
            setToggleResult({ success: false, message: "Network error when toggling key usage." })
        } finally {
            setIsToggling(false)
        }
    }

    const handleToggleRevealKey = async () => {
        if (isKeyRevealed) {
            setIsKeyRevealed(false)
            return
        }

        if (revealedKey) {
            setIsKeyRevealed(true)
            return
        }

        setIsFetchingKey(true)
        try {
            const res = await fetch(getApiUrl("api-key"), {
                credentials: "include",
            })
            const data = await res.json()
            if (res.ok && data.success && data.llmApiKey) {
                setRevealedKey(data.llmApiKey)
                setIsKeyRevealed(true)
            }
        } catch (err) {
            console.error("Failed to fetch API key:", err)
        } finally {
            setIsFetchingKey(false)
        }
    }

    const handleCopyKey = () => {
        if (!revealedKey) return
        navigator.clipboard.writeText(revealedKey)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-zinc-900">AI Model Configuration</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-2">
                Bring your own API key (BYOK) to use your preferred AI model for interviews. Leave blank or toggle OFF to use platform default.
            </p>

            {/* Info banner — STT/TTS clarification */}
            <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-6">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    This key is used <span className="font-semibold">for AI question generation and answer evaluation</span> (LLM). Platform default key automatically acts as a backup fallback if your key reaches quota.
                </p>
            </div>

            {/* Current status & Toggle Switch — shown when a key is saved */}
            {hasApiKey && savedProvider && (
                <div className="space-y-3 mb-6">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-zinc-900">
                                            {LLM_PROVIDERS.find((p) => p.id === savedProvider)?.name || savedProvider} Key Configured
                                        </p>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${useCustomKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                            {useCustomKey ? "● Custom Key Active" : "○ Platform Fallback Active"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {useCustomKey
                                            ? "Your custom API key is primary. Platform key acts as fallback."
                                            : "Currently using Platform default API key."}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveKey}
                                disabled={isRemoving}
                                className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {isRemoving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3 w-3" />
                                )}
                                Remove
                            </button>
                        </div>

                        {/* Saved API Key Reveal Row */}
                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <span className="text-xs font-medium text-zinc-500">Saved API Key</span>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono bg-zinc-100 px-2.5 py-1 rounded text-zinc-800 tracking-wider border border-zinc-200/80 truncate max-w-[200px] sm:max-w-[320px]">
                                        {isKeyRevealed && revealedKey ? revealedKey : "••••••••••••••••••••••••"}
                                    </code>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleToggleRevealKey}
                                    disabled={isFetchingKey}
                                    className="text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                    title={isKeyRevealed ? "Hide API key" : "Show API key"}
                                >
                                    {isFetchingKey ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : isKeyRevealed ? (
                                        <>
                                            <EyeOff className="h-3.5 w-3.5" />
                                            <span>Hide Key</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Show Key</span>
                                        </>
                                    )}
                                </button>

                                {isKeyRevealed && revealedKey && (
                                    <button
                                        type="button"
                                        onClick={handleCopyKey}
                                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                                        title="Copy API key"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                <span className="text-emerald-600 font-semibold">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="h-3.5 w-3.5" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modern Toggle Switch Row */}
                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="custom-key-toggle" className="text-sm font-medium text-zinc-800 cursor-pointer">
                                    Use Custom API Key
                                </Label>
                                <p className="text-xs text-zinc-400">
                                    Toggle between your custom key and platform default key
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {isToggling && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                                <button
                                    id="custom-key-toggle"
                                    type="button"
                                    role="switch"
                                    aria-checked={useCustomKey}
                                    disabled={isToggling}
                                    onClick={handleToggleKeyUsage}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        useCustomKey ? "bg-blue-600" : "bg-zinc-200"
                                    } ${isToggling ? "opacity-60 cursor-wait" : ""}`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                            useCustomKey ? "translate-x-5" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {toggleResult && (
                            <div className={`text-xs px-3 py-1.5 rounded-md border ${toggleResult.success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                {toggleResult.message}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Provider dropdown + API key input */}
            <div className="space-y-4 max-w-md">
                {/* Provider dropdown */}
                <div className="space-y-1.5">
                    <Label htmlFor="llm-provider">Provider</Label>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            id="llm-provider"
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center justify-between w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm transition-colors hover:bg-zinc-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <span className="flex items-center gap-2.5">
                                {selectedProviderInfo ? (
                                    <>
                                        <span className="flex items-center justify-center h-5 w-5 shrink-0">
                                            {selectedProviderInfo.icon}
                                        </span>
                                        <span className="text-zinc-900 font-medium">{selectedProviderInfo.name}</span>
                                    </>
                                ) : (
                                    <span className="text-zinc-400">Select a provider</span>
                                )}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Dropdown menu */}
                        {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-100">
                                {LLM_PROVIDERS.map((provider) => (
                                    <button
                                        key={provider.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedProvider(provider.id)
                                            setIsDropdownOpen(false)
                                            setTestResult(null)
                                            setSaveResult(null)
                                        }}
                                        className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                                            selectedProvider === provider.id
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-zinc-700 hover:bg-zinc-50"
                                        }`}
                                    >
                                        <span className="flex items-center justify-center h-5 w-5 shrink-0">
                                            {provider.icon}
                                        </span>
                                        <span className="font-medium">{provider.name}</span>
                                        {selectedProvider === provider.id && (
                                            <Check className="h-4 w-4 ml-auto text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* API key input — only show when a provider is selected */}
                {selectedProvider && (
                    <>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="api-key">API Key</Label>
                                {selectedProviderInfo?.helpUrl && (
                                    <a
                                        href={selectedProviderInfo.helpUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                    >
                                        Get a key →
                                    </a>
                                )}
                            </div>
                            <div className="relative">
                                <Input
                                    id="api-key"
                                    type={showKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => {
                                        setApiKey(e.target.value)
                                        setTestResult(null)
                                        setSaveResult(null)
                                    }}
                                    placeholder={selectedProviderInfo?.placeholder || "Enter your API key"}
                                    autoComplete="off"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                >
                                    {showKey ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400">
                                Your key is encrypted and never shared. Only used server-side for AI calls.
                            </p>
                        </div>

                        {/* Test & Save result messages */}
                        {testResult && (
                            <div
                                className={`rounded-md px-3 py-2 text-sm border ${
                                    testResult.success
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }`}
                            >
                                {testResult.message}
                            </div>
                        )}

                        {saveResult && (
                            <div
                                className={`rounded-md px-3 py-2 text-sm border ${
                                    saveResult.success
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }`}
                            >
                                {saveResult.message}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestKey}
                                disabled={!apiKey || isTesting}
                                className="cursor-pointer"
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Testing…
                                    </>
                                ) : testResult?.success ? (
                                    <>
                                        <Check className="h-4 w-4 text-emerald-600" />
                                        Valid
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-4 w-4" />
                                        Test Key
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!apiKey || isSaving}
                                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <Key className="h-4 w-4" />
                                        Save Key
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
