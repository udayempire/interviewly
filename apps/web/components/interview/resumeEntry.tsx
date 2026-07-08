"use client"

import { CloudUpload, FileText } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "../ui/button"

export const ResumeEntry = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState<string | null>(null)
    const [dragging, setDragging] = useState(false)

    const handleFile = (file: File | undefined) => {
        if (!file) return
        setFileName(file.name)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    }

    return (
        <div className="border border-zinc-200 p-5 rounded-lg bg-white flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5 text-purple-500" />
                </div>
                <div>
                    <h2 className="font-semibold text-[14px] text-zinc-900 leading-tight">
                        3. Upload your resume{" "}
                        <span className="font-normal text-zinc-400">(optional)</span>
                    </h2>
                    <p className="text-[12.5px] text-zinc-400 mt-0.5">
                        We&apos;ll tailor questions to your experience
                    </p>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-12 px-4 text-center cursor-pointer transition-colors ${dragging ? "border-blue-400 bg-blue-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"}`}
                onClick={() => inputRef.current?.click()}
            >
                <CloudUpload className="h-8 w-8 text-zinc-400" strokeWidth={1.5} />
                {fileName ? (
                    <p className="text-[13px] font-medium text-zinc-700">{fileName}</p>
                ) : (
                    <>
                        <p className="text-[13px] text-zinc-500 font-medium leading-tight">
                            Drag &amp; drop your resume here
                        </p>
                        <p className="text-[12px] text-zinc-400">PDF, DOCX (Max 5MB)</p>
                    </>
                )}
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 text-[13px] font-medium border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                >
                    Choose File
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </div>
        </div>
    )
}
