import { createLLMProvider, classifyLLMError } from "@repo/llm";
import type { ChatMessage } from "@repo/llm";
import { PDFParse } from "pdf-parse";
import { BadRequestError, ResumeParseError } from "../errors";

/**
 * Ordered list of LLM providers to try for resume extraction.
 * Primary is controlled by RESUME_LLM_PROVIDER (default: "groq").
 * On failure the service automatically falls back through the backup chain.
 */
function getProviderChain(): string[] {
    const primary = process.env.RESUME_LLM_PROVIDER ?? "groq";
    const allProviders = ["groq", "gemini"];
    // Put primary first, then the rest as backups (deduped)
    return [primary, ...allProviders.filter((p) => p !== primary)];
}
// fetch resume data with vario
async function callWithFallback(messages: ChatMessage[]): Promise<string> {
    const chain = getProviderChain();
    let lastError: unknown;

    for (const providerName of chain) {
        try {
            const llm = createLLMProvider(providerName);
            const response = await llm.chat(messages);
            if (providerName !== chain[0]) {
                console.warn(`[resumeExtraction] Primary provider failed. Used fallback: ${providerName}`);
            }
            return response.text;
        } catch (err) {
            lastError = err;
            const reason = classifyLLMError(err);
            console.warn(`[resumeExtraction] Provider "${providerName}" failed (${reason}). Trying next...`);
        }
    }

    throw lastError;
}

export async function extractResumeData(pdfBuffer: Buffer) {
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    const rawResumeText = pdfData.text?.trim(); // removes unnecessary whitespaces.

    let structuredResume: string;

    if (rawResumeText && rawResumeText.length > 50) {
        // Text-layer PDF — use a standard chat/text model
        console.log("Found text layer. Parsing with text model...");
        structuredResume = await callWithFallback([
            {
                role: "system",
                content:
                    "You are an expert resume parser. Extract the following from the resume text: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks.",
            },
            {
                role: "user",
                content: rawResumeText,
            },
        ]);
    } else {
        // Scanned / image-only PDF — render a screenshot and use a vision model
        console.log("No text layer found. Rendering page screenshot for vision model...");
        const screenshotResult = await parser.getScreenshot({ scale: 1.5 });
        const pageImage = screenshotResult.pages[0];

        if (!pageImage?.dataUrl) {
            throw new BadRequestError("Could not extract image from this scanned PDF.");
        }

        console.log("Sending page image to vision model...");
        structuredResume = await callWithFallback([
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "You are an expert resume parser. Extract the following from this resume image: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks.",
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: pageImage.dataUrl,
                        },
                    },
                ],
            },
        ]);
    }

    // Clean markdown backticks (e.g. ```json) and parse into a JSON object
    try {
        const cleanedResume = structuredResume.replace(/```json|```/gi, "").trim();
        const parsedResumeJson = JSON.parse(cleanedResume);
        return parsedResumeJson;
    } catch (parseError) {
        console.error("Failed to parse structured resume JSON:", parseError);
        throw new ResumeParseError("Failed to parse structured resume data.");
    }
}