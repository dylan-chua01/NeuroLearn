import { GoogleGenerativeAI } from "@google/generative-ai";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  concept?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const generateQuestionsFromTranscript = async (transcript: string): Promise<QuizQuestion[]> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Analyze this educational transcript and create an engaging quiz. Follow these rules carefully:

GUIDELINES:
1. CONTEXT:
-Focus on the main educational content, not casual conversation
- Difficulty: Progressive (basic → advanced concepts)
- Style: Conceptual understanding > rote memorization

2. QUESTIONS:
- Generate 10-15 questions
- For each question:
  • Focus on 1 key concept
  • Phrase as application-based scenarios when possible
  • Include 1 distractor (plausible wrong answer)
  • Options should be mutually exclusive
  • Correct answer index (0-3) must be accurate

3. FORMAT:
- Return ONLY this JSON structure:
[
  {
    "question": "Application-based question?",
    "options": ["Option1", "Option2", "Option3", "Option4"],
    "correctAnswer": 1,
    "explanation": "Concise rationale (1-2 sentences)",
    "concept": "Underlying topic",
    "difficulty": "easy/medium/hard"
  }
]

4. QUALITY CHECKS:
- No duplicate questions
- No trivial/obvious questions
- Explanations should reference transcript content

TRANSCRIPT:
${transcript}
`;

  let response;

  try {
    const result = await model.generateContent(prompt);
    response = await result.response;
    const text = response.text();

    const cleanJsonString = text
      .replace(/```json|```/g, '')
      .replace(/[\r\n]+/g, '')
      .trim();

    if (!cleanJsonString.startsWith('[') || !cleanJsonString.endsWith(']')) {
      throw new Error('Invalid JSON format - expected array');
    }

    const questions: QuizQuestion[] = JSON.parse(cleanJsonString);

    if (!Array.isArray(questions)) {
      throw new Error('Expected array of questions');
    }

    questions.forEach((q: QuizQuestion, i: number) => {
      if (!q.question || !q.options || q.correctAnswer === undefined) {
        throw new Error(`Invalid question structure at index ${i}`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${i} must have exactly 4 options`);
      }
    });

    return questions;
  } catch (error) {
    console.error("Gemini Error Details:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      prompt,
      responseText: response?.text()
    });
    throw new Error(`Quiz generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};