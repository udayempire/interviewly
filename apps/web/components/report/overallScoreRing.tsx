"use client";

import { useEffect, useState } from "react";

interface OverallScoreRingProps {
    score: number;
    maxScore?: number;
    label?: string;
    sublabel?: string;
}

export const OverallScoreRing = ({
    score,
    maxScore = 100,
    label = "Great Performance! 🎉",
    sublabel = "You scored higher than 78% of users",
}: OverallScoreRingProps) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [dashOffset, setDashOffset] = useState(0);

    const radius = 70;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const size = (radius + strokeWidth) * 2;

    useEffect(() => {
        // Trigger animation after mount
        const timeout = setTimeout(() => {
            const progress = score / maxScore;
            setDashOffset(circumference * (1 - progress));
        }, 100);

        // Animate the number counting up
        const duration = 1500;
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));
            if (progress >= 1) clearInterval(interval);
        }, 16);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [score, maxScore, circumference]);

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-zinc-700">Overall Score</p>
            <div className="relative" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    className="-rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        style={{
                            transition: "stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                    />
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                    </defs>
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-zinc-800">{animatedScore}</span>
                    <span className="text-sm text-zinc-400">/{maxScore}</span>
                </div>
            </div>
            <p className="text-sm font-medium text-zinc-700">{label}</p>
            <p className="text-xs text-zinc-400 text-center">{sublabel}</p>
        </div>
    );
};
