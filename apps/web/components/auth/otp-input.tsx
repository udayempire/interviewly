"use client";

import { useRef } from "react";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const otpLength = 6;

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from(
    { length: otpLength },
    (_, index) => value[index] ?? "",
  );

  const updateValue = (index: number, input: string) => {
    const nextDigit = input.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    onChange(next.join(""));

    if (nextDigit && index < otpLength - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const pasteCode = (index: number, pastedValue: string) => {
    const pastedDigits = pastedValue
      .replace(/\D/g, "")
      .slice(0, otpLength - index);
    if (!pastedDigits) return;

    const next = [...digits];
    pastedDigits.split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    onChange(next.join(""));
    inputs.current[
      Math.min(index + pastedDigits.length, otpLength - 1)
    ]?.focus();
  };

  return (
    <div className="flex gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          aria-label={`OTP digit ${index + 1}`}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          required
          value={digit}
          onChange={(event) => updateValue(index, event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            pasteCode(index, event.clipboardData.getData("text"));
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digit && index > 0) {
              inputs.current[index - 1]?.focus();
            }
          }}
          className="h-10 min-w-0 flex-1 border border-[#8d8c85] bg-[#fffdf8] text-center font-mono text-base font-semibold outline-none transition-colors focus:border-[#20201e]"
        />
      ))}
    </div>
  );
}
