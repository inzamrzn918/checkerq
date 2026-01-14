import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';

// In Expo, environment variables prefixed with EXPO_PUBLIC_ are accessible via process.env
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

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
    studentName?: string;
    results: EvaluationResult[];
    overallFeedback: string;
}

let userApiKey = DEFAULT_API_KEY;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.message?.includes('503') || error.message?.includes('overloaded') || error.status === 503)) {
            console.warn(`Model overloaded, retrying in ${initialDelay}ms... (${retries} retries left)`);
            await delay(initialDelay);
            return withRetry(fn, retries - 1, initialDelay * 2);
        }
        throw error;
    }
}

export const GeminiService = {
    setApiKey: (key: string) => {
        userApiKey = key;
    },

    getApiKey: (): string => {
        return userApiKey || DEFAULT_API_KEY;
    },

    async extractQuestions(uris: string | string[]): Promise<Question[]> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        const uriList = Array.isArray(uris) ? uris : [uris];

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const parts = await Promise.all(uriList.map(async (uri) => {
                const base64Data = await new FileSystem.File(uri).base64();
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
        });
    },

    async evaluatePaper(answerSheetUri: string, questions: Question[]): Promise<PaperEvaluation> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const base64Image = await new FileSystem.File(answerSheetUri).base64();

            const prompt = `
        You are an expert teacher. Evaluate this handwritten answer sheet based on the following questions:
        ${JSON.stringify(questions, null, 2)}

        For each question:
        1. Identify the student's answer.
        2. Grade it fairly based on marks.
        3. Provide helpful feedback.

        Return ONLY a JSON object with this structure:
        {
          "studentName": "John Doe", 
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
        });
    },

    async evaluatePaperText(studentText: string, questions: Question[]): Promise<PaperEvaluation> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const prompt = `
        You are an expert teacher. Evaluate the following student answers (extracted via OCR) based on the provided questions.

        QUESTIONS:
        ${JSON.stringify(questions, null, 2)}

        STUDENT ANSWERS (OCR TEXT):
        ${studentText}

        For each question:
        1. Match the student's answer to the question.
        2. Grade it fairly based on marks.
        3. Provide helpful feedback.

        Return ONLY a JSON object with this structure:
        {
          "studentName": "Student Name (if found in text, else 'Unknown')",
          "totalMarks": ${questions.reduce((sum, q) => sum + q.marks, 0)},
          "obtainedMarks": 0,
          "overallFeedback": "Overall performance comment",
          "results": [
            {
              "questionId": "q1",
              "obtainedMarks": 5,
              "studentAnswer": "The matched answer text...",
              "feedback": "Correct"
            }
          ]
        }
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error("Failed to parse evaluation JSON from text");
        });
    },

    async extractStudentInfo(uri: string): Promise<{ name?: string; rollNo?: string; class?: string }> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });
            const base64Data = await new FileSystem.File(uri).base64();

            const prompt = `
                Analyze this exam paper cover page. Extract the following student details:
                1. Student Name
                2. Roll Number / Student ID
                3. Class / Grade

                Return ONLY a JSON object:
                {
                    "name": "Returned Name",
                    "rollNo": "123",
                    "class": "10"
                }
                If a field is not found, return null.
            `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{.*\}/s);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return {};
        });
    },

    async extractText(uri: string): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });
            const base64Data = await new FileSystem.File(uri).base64();

            const prompt = "Transcribe the handwritten or printed text from this image exactly as it is. Use markdown format if there are tables or lists.";

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]);
            const response = await result.response;
            return response.text();
        });
    }
};
