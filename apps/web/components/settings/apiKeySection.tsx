"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Key, Loader2, Check, Trash2, Zap, Info, ChevronDown } from "lucide-react"

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
}

export function ApiKeySection({ savedProvider, hasApiKey = false }: ApiKeySectionProps) {
    const [selectedProvider, setSelectedProvider] = useState(savedProvider || "")
    const [apiKey, setApiKey] = useState("")
    const [showKey, setShowKey] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isRemoving, setIsRemoving] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedProviderInfo = LLM_PROVIDERS.find((p) => p.id === selectedProvider)

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

    const handleTestKey = async () => {
        if (!apiKey || !selectedProvider) return
        setIsTesting(true)
        setTestResult(null)

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/api-key/test`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ provider: selectedProvider, apiKey }),
                }
            )
            const data = await res.json()
            if (res.ok) {
                setTestResult({ success: true, message: "API key is valid!" })
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
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/api-key`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ provider: selectedProvider, apiKey }),
                }
            )
            const data = await res.json()
            if (res.ok) {
                setSaveResult({ success: true, message: "API key saved successfully!" })
                setApiKey("")
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
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/api-key`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            )
            if (res.ok) {
                setSaveResult({ success: true, message: "API key removed. Using default." })
                setSelectedProvider("")
                setApiKey("")
            }
        } catch {
            setSaveResult({ success: false, message: "Failed to remove key." })
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Key className="h-5 w-5 text-zinc-700" />
                <h2 className="text-lg font-semibold text-zinc-900">AI Model Configuration</h2>
            </div>
            <p className="text-sm text-zinc-500 mb-2">
                Bring your own API key to use your preferred AI model for interviews. Leave blank to use our default (limited usage).
            </p>

            {/* Info banner — STT/TTS clarification */}
            <div className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-6">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                    This key is used <span className="font-semibold">only for AI question generation and answer evaluation</span> (LLM).
                    Speech-to-text and text-to-speech are handled by us — no setup needed on your end.
                </p>
            </div>

            {/* Current status — shown when a key is already saved */}
            {hasApiKey && savedProvider && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-800">
                                Custom key active — {LLM_PROVIDERS.find((p) => p.id === savedProvider)?.name || savedProvider}
                            </p>
                            <p className="text-xs text-emerald-600">Your own API key is being used for interviews</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRemoveKey}
                        disabled={isRemoving}
                        className="text-xs font-medium text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                        {isRemoving ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Trash2 className="h-3 w-3" />
                        )}
                        Remove
                    </button>
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
                                className="bg-blue-600 cursor-pointer"
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
