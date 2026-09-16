"use client"

import { CloudUpload, FileText, CheckCircle, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";

interface ResumeEntryProps {
    onFileChange?: (file: File | null) => void
    hasSavedResume?: boolean
};

export const ResumeEntry = ({ onFileChange, hasSavedResume = false }: ResumeEntryProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [dragging, setDragging] = useState(false)
    const [wantsToChange, setWantsToChange] = useState(false)

    const handleFile = (file: File | undefined) => {
        if (!file) {
            setFileName(null)
            onFileChange?.(null)
            return;
        };
        setFileName(file.name)
        onFileChange?.(file)
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    };

    // Show the saved resume banner if user has a saved resume, hasn't uploaded a new one, and hasn't clicked "Change"
    const showSavedResumeBanner = hasSavedResume && !fileName && !wantsToChange

    return (
        <div className="border border-border p-5 rounded-lg bg-card flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5 text-purple-500" />
                </div>
                <div>
                    <h2 className="font-semibold text-[14px] text-foreground leading-tight">
                        3. Upload your resume{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                    </h2>
                    <p className="text-[12.5px] text-muted-foreground mt-0.5">
                        We&apos;ll tailor questions to your experience
                    </p>
                </div>
            </div>

            {showSavedResumeBanner ? (
                /* Saved resume indicator with change option */
                <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-lg py-10 px-4 bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-[13px] font-medium text-emerald-800 dark:text-emerald-300">
                            Resume from your profile will be used
                        </p>
                        <p className="text-[12px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Your saved resume data will be sent automatically
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 text-[12px] font-medium border-border bg-background hover:bg-accent text-muted-foreground gap-1.5"
                        onClick={() => setWantsToChange(true)}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Upload a different resume
                    </Button>
                </div>
            ) : (
                /* Drop zone — shown when no saved resume or user wants to change */
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-12 px-4 text-center cursor-pointer transition-colors ${dragging ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : "border-border bg-muted hover:border-muted-foreground/30"}`}
                    onClick={() => inputRef.current?.click()}
                >
                    <CloudUpload className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                    {fileName ? (
                        <p className="text-[13px] font-medium text-foreground">{fileName}</p>
                    ) : (
                        <>
                            <p className="text-[13px] text-muted-foreground font-medium leading-tight">
                                Drag &amp; drop your resume here
                            </p>
                            <p className="text-[12px] text-muted-foreground">PDF, DOCX (Max 5MB)</p>
                        </>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-[13px] font-medium border-border bg-background hover:bg-accent text-foreground"
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                        >
                            Choose File
                        </Button>
                        {hasSavedResume && wantsToChange && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-[12px] font-medium border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setWantsToChange(false)
                                    setFileName(null)
                                    onFileChange?.(null)
                                }}
                            >
                                Use saved resume
                            </Button>
                        )}
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                </div>
            )}
        </div>
    )
}
