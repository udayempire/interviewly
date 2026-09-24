"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { useMutation } from "@tanstack/react-query"
import { Upload, FileText, Loader2, Check, X, ExternalLink } from "lucide-react"

type ResumeData = {
    skills?: string[]
    name?: string
    currentRole?: string
}

interface ResumeSectionProps {
    resumeData: ResumeData | null
    hasResumePdf: boolean
    onUpdated: () => void
}

export function ResumeSection({ resumeData, hasResumePdf, onUpdated }: ResumeSectionProps) {
    const [dragActive, setDragActive] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const { mutate: uploadResume, isPending, isSuccess, error } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append("resume", file)

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/resume`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            )
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to upload resume")
            }
            return res.json()
        },
        onSuccess: () => {
            setSelectedFile(null)
            onUpdated()
        },
    })

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type === "application/pdf") {
            setSelectedFile(file)
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleUpload = () => {
        if (selectedFile) {
            uploadResume(selectedFile)
        }
    }

    const handleViewResume = () => {
        window.open(
            `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/user/profile/resume/view`,
            "_blank"
        )
    }

    // Extract skills from parsed resume if available
    const skills = resumeData?.skills || []

    return (
        <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Default Resume</h2>
            <p className="text-sm text-muted-foreground mb-6">
                Upload a resume to use as default for new interviews.
            </p>

            {/* Current resume preview */}
            {resumeData && (
                <div className="mb-5 border border-border bg-muted/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Current Resume</span>
                        </div>
                        {hasResumePdf && (
                            <button
                                onClick={handleViewResume}
                                className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors cursor-pointer"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                View PDF
                            </button>
                        )}
                    </div>
                    {resumeData.name && (
                        <p className="text-sm text-foreground font-medium">{resumeData.name}</p>
                    )}
                    {resumeData.currentRole && (
                        <p className="text-xs text-muted-foreground mt-0.5">{resumeData.currentRole}</p>
                    )}
                    {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {(Array.isArray(skills) ? skills : []).slice(0, 12).map((skill: string, i: number) => (
                                <span
                                    key={i}
                                    className="text-xs bg-background border border-border text-muted-foreground px-2 py-0.5 rounded-md"
                                >
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 12 && (
                                <span className="text-xs text-muted-foreground px-1 py-0.5">
                                    +{skills.length - 12} more
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Upload area */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative rounded-none border-2 border-dashed p-8 text-center transition-colors ${
                    dragActive
                        ? "border-amber-500 bg-amber-50/50 dark:bg-blue-950/20"
                        : "border-border bg-background hover:border-muted-foreground/30"
                }`}
            >
                <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                    {selectedFile ? (
                        <span className="font-medium text-foreground">{selectedFile.name}</span>
                    ) : (
                        <>
                            Drag and drop your resume PDF here, or{" "}
                            <label className="text-amber-700 hover:text-amber-800 cursor-pointer font-medium">
                                browse
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">PDF files only</p>
            </div>

            {/* Upload button */}
            {selectedFile && (
                <div className="mt-3 flex justify-start gap-2">
                    <Button onClick={handleUpload} disabled={isPending} className="w-full rounded-none sm:w-auto">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading…
                            </>
                        ) : isSuccess ? (
                            <>
                                <Check className="h-4 w-4" />
                                Uploaded
                            </>
                        ) : (
                            "Upload Resume"
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                        className="shrink-0 rounded-none"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 mt-2">{(error as Error).message}</p>
            )}
        </div>
    )
}
