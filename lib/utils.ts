import { subjectsColors } from "@/constants";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get color for a given subject
export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

// Voice mappings by language, gender, and style
export const voices = {
  en: {
    male: {
      casual: "X5xCFNHQSNeM4ZIZqDa8", // Danbee
      formal: "lUTamkMw7gOzZbFIwmq4", // James
    },
    female: {
      casual: "lcMyyd2HUfFzxdCaC4Ta", // Lucy
      formal: "gmv0PPPs8m6FEf03PImj", // Blondie
    },
  },
  zh: {
    male: {
      casual: "TxGEqnHWrfWFTfGW9XjX", // Josh (works with multilingual)
      formal: "VR6AewLTigWG4xSOukaG", // Arnold (works with multilingual)
    },
    female: {
      casual: "21m00Tcm4TlvDq8ikWAM", // Rachel (works with multilingual)
      formal: "AZnzlk1XvdvUeBnXmlld", // Domi (works with multilingual)
    },
  },
   ms: {
    male: {
      casual: "TxGEqnHWrfWFTfGW9XjX", // Josh (works with multilingual)
      formal: "VR6AewLTigWG4xSOukaG", // Arnold (works with multilingual)
    },
    female: {
      casual: "21m00Tcm4TlvDq8ikWAM", // Rachel (works with multilingual)
      formal: "AZnzlk1XvdvUeBnXmlld", // Domi (works with multilingual)
    },
  },
} as const;

// Transcriber and instruction config
const languageConfig = {
  en: {
    transcriber: "en-US",
    instruction: "You MUST respond ONLY in English. Every single response must be in English.",
    firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}.",
  },
  zh: {
    transcriber: "zh-CN",
    instruction: "你必须只用中文（普通话）回应。使用简体中文字符。绝对不要用英文回应。",
    firstMessage: "你好，让我们开始今天的课程。今天我们将讨论{{topic}}。",
  },
  ms: {
    transcriber: "ms",
    instruction: "Anda MESTI bertindak balas HANYA dalam Bahasa Malaysia. Setiap respons mestilah dalam Bahasa Malaysia sahaja.",
    firstMessage: "Selamat datang, mari kita mulakan sesi hari ini. Hari ini kita akan berbincang tentang {{topic}}.",
  },
} as const;

// Helper to fetch a voiceId with fallback and warnings
const getVoiceId = (
  language: keyof typeof voices,
  voice: keyof typeof voices["en"],
  style: keyof typeof voices["en"]["male"]
): string => {
  const langVoices = voices[language];
  if (!langVoices) {
    console.warn(`⚠️ No voice config for language "${language}". Falling back to English.`);
    return voices.en[voice][style];
  }

  const voiceSet = langVoices[voice];
  if (!voiceSet) {
    console.warn(`⚠️ No voice type "${voice}" in language "${language}". Falling back to English.`);
    return voices.en[voice][style];
  }

  const voiceId = voiceSet[style];
  if (!voiceId) {
    console.warn(`⚠️ No voice style "${style}" for voice "${voice}" in language "${language}". Using fallback.`);
    return voices.en[voice][style];
  }

  return voiceId;
};

// Main assistant configuration - FIXED: Added "ms" to the language type
export const configureAssistant = (
  voice: "male" | "female",
  style: "casual" | "formal",
  language: "en" | "zh" | "ms", // FIXED: Added "ms" here
  topic?: string,
  subject?: string
): CreateAssistantDTO => {
  console.log("🔧 Configuring Assistant:", { voice, style, language, topic, subject });

  const voiceId = getVoiceId(language, voice, style);

  if (language !== "en" && Object.values(voices.en[voice]).includes(voiceId)) {
    console.warn("⚠️ Non-English language selected, but default English voice is used!");
  }

  // FIXED: This will now properly handle "ms" language
  const langConfig = languageConfig[language] || languageConfig.en;

  let firstMessage = langConfig.firstMessage;
  if (topic) {
    firstMessage = firstMessage.replace("{{topic}}", topic);
  }

  const systemPrompt = `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.

CRITICAL LANGUAGE REQUIREMENT: ${langConfig.instruction}

Tutor Guidelines:
- Stick to the given topic: "${topic || "the assigned topic"}" and subject: "${subject || "the assigned subject"}".
- Keep the conversation flowing smoothly while maintaining control.
- Regularly ensure that the student is following and understanding.
- Break down the topic into smaller parts and teach the student one part at a time.
- Keep your style of conversation ${style}.
- Keep your responses short, like in a real voice conversation.
- Do not include any special characters in your responses - this is a voice conversation.

LANGUAGE ENFORCEMENT: Remember, you MUST follow the language instruction above. This overrides everything else. Every word you speak must be in the specified language.`;

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: langConfig.transcriber,
    },
    voice: {
      provider: "11labs",
      voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
    },
    // Add backgroundSound for web calls
    backgroundSound: "off",
    
    // Add silenceTimeoutSeconds to prevent premature call endings
    silenceTimeoutSeconds: 30,
    
    // Add maxDurationSeconds to prevent infinite calls
    maxDurationSeconds: 3600, // 1 hour max
    
    // Add responseDelaySeconds for more natural conversation
    responseDelaySeconds: 0.4,
    
    // Add llmRequestDelaySeconds for processing time
    llmRequestDelaySeconds: 0.1,
    
    // Add numWordsToInterruptAssistant for better interruption handling
    numWordsToInterruptAssistant: 2,
    
    // Add clientMessages configuration
    clientMessages: ["transcript", "hang", "function-call"],
    
    // Add serverMessages configuration (empty for web calls typically)
    serverMessages: [],
  };

  console.log("✅ Assistant configured successfully", vapiAssistant);
  return vapiAssistant;
};