// Build the structured evaluation prompt from the persisted interview transcript.
export function buildEvaluationPrompt(
    interviewDescription: string,
    transcript: { role: "USER" | "ASSISTANT"; content: string }[],
): string {
    const formatted = transcript
        .map((message) => `${message.role === "ASSISTANT" ? "Interviewer" : "Candidate"}: ${message.content}`)
        .join("\n\n");

    return `
You are a senior technical interview evaluator. You have just reviewed a complete interview transcript.
Your job is to produce a thorough, honest, and actionable evaluation of the candidate's performance.

INTERVIEW CONTEXT:
${interviewDescription}

FULL TRANSCRIPT:
${formatted}

EVALUATION INSTRUCTIONS:

Analyse the entire transcript carefully. Then produce a structured evaluation in the following JSON format. Output ONLY valid JSON — no markdown, no explanation, no extra text.

{
  "overallScore": <integer from 0 to 100>,
  "aiSummary": "<2-3 sentence high-level summary of how the candidate performed overall>",
  "strengths": [
    "<specific strength observed, with a concrete example from the transcript>",
    "<another strength>"
  ],
  "improvements": [
    "<specific area to improve, with a concrete example from the transcript>",
    "<another improvement area>"
  ],
  "detailedFeedback": "<detailed paragraph-level feedback covering technical depth, communication, problem-solving approach, and any notable moments in the interview>",
  "breakdown": {
    "technicalKnowledge": <integer 0-100>,
    "communication": <integer 0-100>,
    "problemSolving": <integer 0-100>,
    "relevantExperience": <integer 0-100>,
    "overallImpression": <integer 0-100>
  }
}

SCORING GUIDELINES:
- 90-100: Exceptional. Candidate exceeded expectations on nearly all fronts.
- 75-89: Strong. Solid performance with minor gaps.
- 60-74: Average. Meets some expectations but has notable weaknesses.
- 40-59: Below average. Significant gaps in knowledge or communication.
- 0-39: Poor. Struggled throughout the interview.

Be fair but honest. Base everything strictly on what was said. If this is a partial interview, clearly evaluate only the completed answers and do not penalize unanswered questions.
`;
}
