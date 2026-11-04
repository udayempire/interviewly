import { Send } from "lucide-react";

export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  isListening,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isListening: boolean;
}) {
  return (
    <div className="border-t border-stone-200 p-3 dark:border-zinc-800">
      <div className="flex items-end gap-2 border border-stone-200 bg-stone-50 p-2 dark:border-zinc-700 dark:bg-zinc-950">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
          rows={2}
          placeholder={isListening ? "Listening…" : "Your response will appear here…"}
          className="min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-6 outline-none placeholder:text-stone-400 disabled:cursor-not-allowed dark:text-zinc-100 dark:placeholder:text-zinc-500"
          aria-label="Your interview response"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center bg-zinc-900 text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-300 dark:text-stone-900"
          aria-label="Send response"
          title="Send response"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-stone-500 dark:text-zinc-500">Press Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
