import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// In Expo, environment variables prefixed with EXPO_PUBLIC_ are accessible via process.env
const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const genAI = (key: string) => new GoogleGenerativeAI(key);

export interface Region {
    pageIndex: number;
    boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in normalized 0-1000
}

export interface Question {
    id: string;
    text: string;
    questionNumber?: string; // e.g. "1.a" or "Q1"
    marks: number;
    instruction?: string;
    type: 'MCQ' | 'Descriptive' | 'FillInBlanks' | 'TrueFalse';
    options?: string[]; // For MCQ
    translations?: { [lang: string]: string }; // Map of language code to question text
    regions?: Region[]; // Bounding boxes for the question on the paper
}

export interface EvaluationResult {
    questionId: string;
    questionNumber?: string;
    obtainedMarks: number;
    feedback: string;
    studentAnswer: string;
    needsReview?: boolean; // Flag if AI is unsure or numbering missing
    answerRegions?: Region[]; // Bounding boxes for where the student answered
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






const compressImage = async (uri: string): Promise<string> => {
    try {
        // Skip compression for PDF
        if (uri.toLowerCase().endsWith('.pdf')) return uri;

        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1024 } }], // Resize to max width 1024px, maintaining aspect ratio
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return result.uri;
    } catch (error) {
        console.warn("Image compression failed, using original:", error);
        return uri;
    }
};

const formatQuestionsAsTable = (questions: Question[]): string => {
    const header = "| No | Text | Marks | Type | Options |";
    const divider = "|---|---|---|---|---|";
    const rows = questions.map(q => {
        const no = (q.questionNumber || q.id).replace(/\|/g, '').trim();
        const text = q.text.replace(/[\r\n]+/g, " ").replace(/\|/g, " ").trim().substring(0, 100); // Truncate long text
        const marks = q.marks;
        const type = q.type;
        const options = q.options ? q.options.join(", ").replace(/\|/g, " ") : "";
        return `| ${no} | ${text} | ${marks} | ${type} | ${options} |`;
    });
    return [header, divider, ...rows].join("\n");
};

function parseGeminiResponse(text: string): any {
    // 1. Extract JSON block (greedy match between first { and last })
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error("Gemini Response Text (No JSON found):", text);
        throw new Error("No JSON structure found in Gemini response");
    }

    const jsonString = jsonMatch[0];

    try {
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.warn("Initial JSON parse failed:", error.message);
        // Only attempt sanitization for relevant errors to avoid masking other issues
        // But invalid escape sequence is the most common with LLMs.

        // Attempt 1: Fix common invalid escapes (like \ on its own, or \a, \c, etc)
        // We look for \ that is NOT followed by a valid escape char.
        // Valid chars: " \ / b f n r t u
        let sanitized = jsonString.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

        try {
            return JSON.parse(sanitized);
        } catch (e2) {
            // Attempt 2: Fix invalid Unicode escapes (e.g. \u123 instead of \u0123)
            // Look for \u NOT followed by 4 hex digits
            sanitized = sanitized.replace(/\\u(?![0-9a-fA-F]{4})/g, "\\\\u");

            try {
                return JSON.parse(sanitized);
            } catch (e3) {
                console.error("All JSON parse attempts failed.");
                console.error("Failing JSON Snippet:", jsonString.substring(0, 200) + "...");
                // Throw the original error or the last one?
                throw new Error(`Failed to parse JSON: ${error.message}`);
            }
        }
    }
}


export const GeminiService = {
    setApiKey: (key: string) => {
        userApiKey = key;
    },

    getApiKey: (): string => {
        return userApiKey || DEFAULT_API_KEY;
    },

    async extractQuestions(uris: string | string[]): Promise<{ questions: Question[], languages: string[] }> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        const uriList = Array.isArray(uris) ? uris : [uris];

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const parts = await Promise.all(uriList.map(async (uri) => {
                const compressedUri = await compressImage(uri);
                const base64Data = await new FileSystem.File(compressedUri).base64();
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
        
        CRITICAL INSTRUCTIONS FOR LANGUAGES:
        - Identify all languages used in the question paper (e.g., ["English", "Hindi", "Marathi"]). 
        - Return this as a 'languages' array in the root of the JSON.

        CRITICAL INSTRUCTIONS FOR QUESTION NUMBERS:
        - Extract the EXACT question number as written on the paper (e.g., "59", "1.a", "Section A - Q1").
        - If the paper starts numbering from 46, use 46. DO NOT start from 1 unless the paper does.
        - If there is no number, leave 'questionNumber' null.
        
        For each question, identify:
        1. The literal question label/number as 'questionNumber'.
        2. The primary question text.
        3. If the question is written in multiple languages, provide a 'translations' object.
        4. Maximum marks allocated.
        5. Type (MCQ, Descriptive, FillInBlanks, TrueFalse).
        6. Options if MCQ.
        7. EXACT location coordinates as 'regions': An array of objects with { pageIndex: number, boundingBox: [ymin, xmin, ymax, xmax] } where 0-1000 are normalized coordinates.

        Return ONLY a JSON object:
        {
            "languages": ["English", "Hindi"],
            "questions": [
                {
                    "questionNumber": "1.a",
                    "text": "...",
                    "marks": 5,
                    "type": "Descriptive",
                    "regions": [{"pageIndex": 0, "boundingBox": [120, 50, 200, 950]}],
                    "translations": {"Hindi": "..."}
                }
            ]
        }
      `;

            const result = await model.generateContent([prompt, ...parts]);
            const response = await result.response;
            const text = response.text();

            const data = parseGeminiResponse(text);
            const rawQuestions = data.questions || [];
            const languages = data.languages || [];

            // Ensure globally unique IDs for each question
            const questions = rawQuestions.map((q: any, index: number) => ({
                ...q,
                id: `q_${Date.now()}_${index}`,
                // Ensure marks is a number
                marks: Number(q.marks) || 0
            }));

            return { questions, languages };
        });
    },

    async evaluatePaper(answerSheetUri: string, questions: Question[]): Promise<PaperEvaluation> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const compressedUri = await compressImage(answerSheetUri);
            const base64Image = await new FileSystem.File(compressedUri).base64();

            const tableQuestions = formatQuestionsAsTable(questions);

            const prompt = `
        You are an expert teacher. Evaluate this handwritten answer sheet based on the following questions:
        ${tableQuestions}

        For each question:
        1. Identify the student's answer.
        2. Grade it fairly based on marks.
        3. Provide helpful feedback.
        4. CRITICAL: Return the exact bounding box of the answer as 'answerRegions' (see below).

        Return ONLY a JSON object with this structure:
        {
          "studentName": "John Doe", 
          "totalMarks": 50,
          "obtainedMarks": 45,
          "overallFeedback": "...",
          "results": [
            {
              "questionId": "q1",
              "obtainedMarks": 5,
              "studentAnswer": "...",
              "feedback": "Correct",
              "answerRegions": [{"pageIndex": 0, "boundingBox": [100, 100, 200, 500]}] // [ymin, xmin, ymax, xmax] 0-1000
            }
          ]
        }
      `;

            // Calculate actual total marks from the questions source of truth
            const calculatedTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

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
            const parsed = parseGeminiResponse(text);

            // Override totalMarks with the correct calculated value
            if (parsed) {
                parsed.totalMarks = calculatedTotalMarks;
            }
            return parsed;
        });
    },

    async evaluatePaperText(studentText: string, questions: Question[]): Promise<PaperEvaluation> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found. Please set it in Settings.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });

            const tableQuestions = formatQuestionsAsTable(questions);

            const prompt = `
        You are an expert teacher. Evaluate the following student answers (extracted via OCR) based on the following questions.

        QUESTIONS:
        ${tableQuestions}

        STUDENT ANSWERS (OCR TEXT):
        ${studentText}

        Evaluation Rules:
        1. Match the student's answer to the corresponding question using the 'questionNumber' (e.g., "59", "2.a").
        2. If a question number in the student's answer is unclear, missing, or mislabeled, set "needsReview": true for that result.
        3. IMPORTANT: In the results array, explicitly include the 'questionNumber' you matched against.
        4. Grade fairly based on marks and provide helpful feedback.

        Return ONLY a JSON object:
        For each question, compare the student's handwritten answer against the target question.
        
        CRITICAL: 
        1. For each evaluated segment/answer, return the exact coordinates where you found the answer on the student's paper as 'answerRegions'.
        2. Use normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000.
        3. IMPORTANT: Be generous with the bounding box. Include the entire answer text plus a small margin. Do not crop closely.
        4. If an answer spans multiple regions or pages, include all in the array.

        Return a JSON object:
        {
            "studentName": "...",
            "obtainedMarks": 12.5,
            "overallFeedback": "...",
            "results": [
                {
                    "questionId": "...",
                    "questionNumber": "...",
                    "obtainedMarks": 5.0,
                    "feedback": "...",
                    "studentAnswer": "...",
                    "needsReview": false,
                    "answerRegions": [{"pageIndex": 1, "boundingBox": [300, 100, 600, 900]}]
                }
            ]
        }
      `;

            // Calculate actual total marks from the questions source of truth
            const calculatedTotalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const parsed = parseGeminiResponse(text);
            // Override totalMarks with the correct calculated value
            if (parsed) {
                parsed.totalMarks = calculatedTotalMarks;
            }
            return parsed;
        });
    },

    async extractStudentInfo(uri: string): Promise<{ name?: string; rollNo?: string; class?: string }> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });
            const compressedUri = await compressImage(uri);
            const base64Data = await new FileSystem.File(compressedUri).base64();

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

            try {
                return parseGeminiResponse(text);
            } catch (e) {
                return {};
            }
        });
    },

    async extractText(uri: string): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error("API Key not found.");

        return withRetry(async () => {
            const model = genAI(apiKey).getGenerativeModel({ model: "gemini-flash-latest" });
            const compressedUri = await compressImage(uri);
            const base64Data = await new FileSystem.File(compressedUri).base64();

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
