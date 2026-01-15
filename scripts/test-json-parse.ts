
function parseGeminiResponse(text: string): any {
    // 1. Extract JSON block (greedy match between first { and last })
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("No JSON structure found in Gemini response");
    }

    const jsonString = jsonMatch[0];

    try {
        return JSON.parse(jsonString);
    } catch (error: any) {
        if (error.message.includes("invalid escape sequence") || error.message.includes("Unexpected token")) {
            console.log("Caught expected error, attempting sanitize...");
            // Attempt to fix common issues:
            // 1. Double escape backslashes that aren't part of a valid escape sequence
            // Valid JSON escapes: " \ / b f n r t u
            const sanitized = jsonString.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
            try {
                return JSON.parse(sanitized);
            } catch (e) {
                // If that fails, throw the original error or a comprehensive one
                throw new Error(`Failed to parse JSON even after sanitization: ${error.message}`);
            }
        }
        throw error;
    }
}

const testCases = [
    {
        name: "Valid JSON",
        input: '{"key": "value"}',
        shouldPass: true
    },
    {
        name: "JSON with Markdown",
        input: '```json\n{"key": "value"}\n```',
        shouldPass: true
    },
    {
        name: "Invalid Escape Sequence (single backslash)",
        input: '{"path": "C:\\Users"}', // In JS string this is C:\Users which is invalid JSON if not escaped again. Wait.
        // In JS string literal '{"path": "C:\\Users"}' represents the string {"path": "C:\Users"}
        // In JSON, backslash must be escaped. So '{"path": "C:\\Users"}' is valid JSON for "C:\Users".
        // BUT if the model returns '{"path": "C:\Users"}', that is invalid JSON.
        // In JS string literal this would be '{"path": "C:\\Users"}' if we want to represent that bad JSON.
        // Wait, '{"path": "C:\Users"}' -> \U is invalid escape.
        input: `{"path": "C:\\Users"}`, // This is valid JSON? No. "C:\" -> escaped U? No.
        // Let's be precise.
        // String to parse: {"text": "foo \bar"}
        // In JS source: `{"text": "foo \\bar"}` represents the string with a single backslash before b.
        // \b is valid (backspace). \a is not.
        input: `{"text": "foo \\alpha"}`,
        shouldPass: true
    },
    {
        name: "Mixed valid and invalid",
        input: `{"text": "line1\\nline2 \\beta"}`, // valid \n, invalid \b (wait \b is valid). \B is invalid? No regex is case sensitive?
        // \b is backspace. \f formfeed.
        // Let's use \x which is definitely invalid in standard JSON (hex escape uses \u)
        input: `{"text": "valid \\n invalid \\x"}`,
        shouldPass: true
    }
];

testCases.forEach(tc => {
    console.log(`Running test: ${tc.name}`);
    try {
        const result = parseGeminiResponse(tc.input);
        console.log("Result:", JSON.stringify(result));
        if (tc.shouldPass) console.log("PASS");
        else console.log("FAIL (Expected failure)");
    } catch (e) {
        console.log("Error:", (e as Error).message);
        if (!tc.shouldPass) console.log("PASS");
        else console.log("FAIL (Expected success)");
    }
    console.log("---");
});
