import * as FileSystem from 'expo-file-system/legacy';

const API_KEY = process.env.MISTRAL_API_KEY || process.env.EXPO_PUBLIC_MISTRAL_API_KEY || "";
const MISTRAL_OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";

export interface MistralOCRResult {
    pages: {
        index: number;
        markdown: string;
        images: any[];
    }[];
}

export const MistralService = {
    async extractText(uri: string): Promise<string> {
        if (!API_KEY) {
            console.error("Mistral API Key is missing. Please check MISTRAL_API_KEY or EXPO_PUBLIC_MISTRAL_API_KEY in .env");
            throw new Error("Mistral API Key not configured.");
        }

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Mistral OCR API expects a document object with type 'image_url' and the base64 data
            // Based on standard Mistral API patterns for vision/file uploads
            const payload = {
                model: "mistral-ocr-latest",
                document: {
                    type: "image_url",
                    image_url: `data:image/jpeg;base64,${base64}`
                }
            };

            const response = await fetch(MISTRAL_OCR_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Mistral API Error (${response.status}): ${errText}`);
            }

            const data: MistralOCRResult = await response.json();

            // Combine markdown from all pages
            const fullText = data.pages.map(p => p.markdown).join("\n\n---\n\n");
            return fullText;

        } catch (error) {
            console.error("Mistral OCR Error:", error);
            throw error;
        }
    }
};
