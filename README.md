# CheckerQ - AI Exam Evaluator

An Android app built with Expo that automates the evaluation of handwritten exam sheets.

## Features
- **Pipeline Setup**: Upload or take a photo of a question paper. The system uses Gemini AI to extract questions, marks, and instructions.
- **Marking Scheme Review**: Verify and edit the extracted questions and assigned marks.
- **Handwritten Evaluation**: Scan student answer sheets. Gemini AI reads the handwriting, compares it against the question paper, and provides fair grading with detailed feedback.
- **Premium UI**: Dark mode, smooth transitions, and intuitive dashboard.

## Tech Stack
- **Frontend**: React Native (Expo)
- **Navigation**: React Navigation (Stack)
- **AI Engine**: Google Gemini 1.5 Flash
- **Icons**: Lucide React Native

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure API Key**:
   - Open the app.
   - Go to **Settings** (top right icon).
   - Enter your **Google Gemini API Key**.
   - Save.

3. **Create a Pipeline**:
   - Tap **New Exam Pipeline**.
   - Upload/Snap a question paper image.
   - Review the extracted JSON-like structure of questions.
   - Confirm to save.

4. **Evaluate Sheets**:
   - Tap **Start Evaluation**.
   - Snap a photo of the student's handwritten answer sheet.
   - Wait for AI to process and grade.
   - View results and feedback.

## Running the App
```bash
npx expo start --android
```
