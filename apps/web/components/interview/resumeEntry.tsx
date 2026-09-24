"use client";

import { Check, FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface ResumeEntryProps {
  onFileChange?: (file: File | null) => void;
  hasSavedResume?: boolean;
}

export const ResumeEntry = ({ onFileChange, hasSavedResume = false }: ResumeEntryProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [useSavedResume, setUseSavedResume] = useState(true);
  const isUsingSavedResume = hasSavedResume && useSavedResume && !fileName;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setUseSavedResume(false);
    onFileChange?.(file);
  };

  const useSaved = () => {
    setFileName(null);
    setUseSavedResume(true);
    onFileChange?.(null);
  };

  return (
    <section className="bg-[#fffdf8] p-5 dark:bg-[#20201e] md:col-span-2 xl:col-span-1 sm:p-6">
      <div className="flex items-center gap-2.5">
        <FileText className="h-4 w-4 text-[#8b6b14]" strokeWidth={1.7} />
        <div>
          <h2 className="text-sm font-semibold text-[#20201e] dark:text-[#fffdf8]">Resume <span className="font-normal text-[#77746b] dark:text-[#b8b4a9]">(optional)</span></h2>
          <p className="mt-0.5 text-xs text-[#77746b] dark:text-[#b8b4a9]">PDF or DOCX, up to 5MB</p>
        </div>
      </div>

      {isUsingSavedResume ? (
        <div className="mt-5 border border-[#d6b458] bg-[#fff7d8] px-4 py-3 dark:border-[#8e721f] dark:bg-[#302d22]">
          <div className="flex items-start gap-2 text-[13px] text-[#55461a] dark:text-[#f3d46c]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Using your saved resume.</span>
          </div>
          <button onClick={() => setUseSavedResume(false)} className="mt-2 text-xs font-semibold text-[#55461a] underline decoration-[#d39c13] underline-offset-4 dark:text-[#f3d46c]">
            Upload a different file
          </button>
        </div>
      ) : (
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); handleFile(event.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`mt-5 flex min-h-25 cursor-pointer flex-col items-center justify-center border border-dashed px-4 text-center transition-colors ${dragging ? "border-[#b98815] bg-[#fff7d8] dark:border-[#d6b458] dark:bg-[#302d22]" : "border-[#cfcbbf] bg-[#fffdf8] hover:border-[#a9a394] dark:border-[#4a4942] dark:bg-[#292925] dark:hover:border-[#807c70]"}`}
        >
          <Upload className="h-4 w-4 text-[#77746b] dark:text-[#b8b4a9]" strokeWidth={1.6} />
          <p className="mt-2 text-[13px] font-medium text-[#3c3a34] dark:text-[#fffdf8]">{fileName || "Choose a resume"}</p>
          {!fileName && <p className="mt-0.5 text-xs text-[#77746b] dark:text-[#b8b4a9]">or drag and drop</p>}
          <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
        </div>
      )}
      {hasSavedResume && !isUsingSavedResume && (
        <button onClick={useSaved} className="mt-3 text-xs font-semibold text-[#55461a] underline decoration-[#d39c13] underline-offset-4 dark:text-[#f3d46c]">
          Use saved resume instead
        </button>
      )}
    </section>
  );
};
