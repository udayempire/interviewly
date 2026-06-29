import { createLLMProvider } from "@repo/llm";
import { PDFParse } from "pdf-parse";
import { BadRequestError, ResumeParseError } from "../errors";

export async function extractResumeData(
    pdfBuffer: Buffer
) {
    const llm = createLLMProvider("groq");
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    const rawResumeText = pdfData.text?.trim(); // removes unnecessary whitespaces.

    let structuredResume: string;

    if (rawResumeText && rawResumeText.length > 50) {
        console.log("Found text layer. Parsing with Llama Text model...");
        structuredResume = await llm.chat([
            {
                role: "system",
                content: "You are an expert resume parser. Extract the following from the resume text: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks."
            },
            {
                role: "user",
                content: rawResumeText
            }
        ]);
    } else {
        console.log("No text layer found. Rendering page screenshot for Groq Vision...");
        const screenshotResult = await parser.getScreenshot({ scale: 1.5 });
        const pageImage = screenshotResult.pages[0];

        if (!pageImage?.dataUrl) {
            throw new BadRequestError("Could not extract image from this scanned PDF.");
        }

        console.log("Sending page image to meta-llama model...");
        structuredResume = await llm.chat([
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "You are an expert resume parser. Extract the following from this resume image: name, currentRole, yearsOfExperience, skills, experience, education, projects. Return ONLY a valid JSON object matching this schema. Do not include markdown formatting or backticks."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: pageImage.dataUrl
                        }
                    }
                ]
            }
        ]);
    }
    // Clean markdown backticks (e.g. ```json) and parse into a JSON object
    let parsedResumeJson: any = null;
    try {
        const cleanedResume = structuredResume.replace(/```json|```/gi, "").trim();
        parsedResumeJson = JSON.parse(cleanedResume);
        return parsedResumeJson;
    } catch (parseError) {
        console.error("Failed to parse structured resume JSON:", parseError);
        throw new ResumeParseError("Failed to parse structured resume data.");
    }
}