import { executeLLMWithFallback, type LLMExecutionOptions } from "@repo/llm";
import type { ChatMessage } from "@repo/llm";
import { PDFParse } from "pdf-parse";
import { BadRequestError, ResumeParseError } from "../errors";

// Fetch resume data with configured platform LLM failover.
async function callWithFallback(messages: ChatMessage[], tier: LLMExecutionOptions["tier"] = "FREE"): Promise<string> {
    const { response, fallbackNotice } = await executeLLMWithFallback({ messages, tier });
    if (fallbackNotice.occurred) console.warn(`[resumeExtraction] Used LLM fallback after ${fallbackNotice.reason}.`);
    return response.text;
}

export async function extractResumeData(pdfBuffer: Buffer, tier: LLMExecutionOptions["tier"] = "FREE") {
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
        ], tier);
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
        ], tier);
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
