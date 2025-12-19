import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system/legacy';

// In Expo, environment variables prefixed with EXPO_PUBLIC_ are accessible via process.env
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const genAI = (key: string) => new GoogleGenerativeAI(key);

export interface Question {
    id: string;
    text: string;
    marks: number;
    instruction?: string;
    type: 'MCQ' | 'Descriptive' | 'FillInBlanks' | 'TrueFalse';
    options?: string[]; // For MCQ
}

export interface EvaluationResult {
    questionId: string;
    obtainedMarks: number;
    feedback: string;
    studentAnswer: string;
}

export interface PaperEvaluation {
    totalMarks: number;
    obtainedMarks: number;
    results: EvaluationResult[];
    overallFeedback: string;
}

let userApiKey = API_KEY;

export const GeminiService = {
    setApiKey: (key: string) => {
        userApiKey = key;
    },

    async extractQuestions(uris: string | string[]): Promise<Question[]> {
        if (!userApiKey) throw new Error("API Key not found. Please set it in Settings.");

        const uriList = Array.isArray(uris) ? uris : [uris];

        try {
            const model = genAI(userApiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const parts = await Promise.all(uriList.map(async (uri) => {
                const base64Data = await FileSystem.readAsStringAsync(uri, {
                    encoding: 'base64',
                });
                const isPdf = uri.toLowerCase().endsWith('.pdf');
                return {
                    inlineData: {
                        data: base64Data,
                        mimeType: isPdf ? "application/pdf" : "image/jpeg",
                    },
                };
            }));

            const prompt = `
        You are an expert exam paper reader. Extract all questions from the provided paper pages (images or PDF).
        For each question, identify:
        1. The question text.
        2. Maximum marks allocated.
        3. Instruction types (MCQ, Descriptive, Fill in the blanks, True/False).
        4. Options if it's an MCQ.

        Return ONLY a JSON array with the following structure:
        [
          {
            "id": "q1",
            "text": "Question text here",
            "marks": 5,
            "type": "Descriptive",
            "instruction": "Explain in detail"
          }
        ]
      `;

            const result = await model.generateContent([prompt, ...parts]);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Failed to parse JSON from Gemini response");
        } catch (error) {
            console.error("Extraction error:", error);
            throw error;
        }
    },

    async evaluatePaper(answerSheetUri: string, questions: Question[]): Promise<PaperEvaluation> {
        if (!userApiKey) throw new Error("API Key not found. Please set it in Settings.");

        try {
            const model = genAI(userApiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const base64Image = await FileSystem.readAsStringAsync(answerSheetUri, {
                encoding: 'base64',
            });

            const prompt = `
        You are an expert teacher. Evaluate this handwritten answer sheet based on the following questions:
        ${JSON.stringify(questions, null, 2)}

        For each question:
        1. Identify the student's answer.
        2. Grade it fairly based on marks.
        3. Provide helpful feedback.

        Return ONLY a JSON object with this structure:
        {
          "totalMarks": 50,
          "obtainedMarks": 45,
          "overallFeedback": "Overall performance comment",
          "results": [
            {
              "questionId": "q1",
              "obtainedMarks": 5,
              "studentAnswer": "...",
              "feedback": "Correct"
            }
          ]
        }
      `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg",
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();
            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Failed to parse evaluation JSON");
        } catch (error) {
            console.error("Evaluation error:", error);
            throw error;
        }
    }
};
