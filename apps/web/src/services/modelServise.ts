"use server";
import { GoogleGenAI } from "@google/genai";

// Always use the recommended initialization with named parameter and direct environment variable access.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getAIPerformanceSummary = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following engineering metrics and provide a 2-sentence professional executive summary: ${JSON.stringify(stats)}`,
      config: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
    // Property access .text is correct (do not call as a method).
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate AI insights at this moment.";
  }
};
