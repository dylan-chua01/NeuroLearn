import { subjectsColors } from "@/constants"
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getSubjectColor = (subject: string) => {
  return subjectsColors[subject as keyof typeof subjectsColors];
};

export const voices = {
  male: {
    casual: "pNInz6obpgDQGcFmaJgB", // Adam - Natural and friendly
    formal: "VR6AewLTigWG4xSOukaG"  // Arnold - Professional and clear
  },
  female: {
    casual: "oWAxZDx7w5VEj9dCyTzz", // Grace - Warm and conversational  
    formal: "21m00Tcm4TlvDq8ikWAM"  // Rachel - Professional and articulate
  }
}

// Add this function to help debug
export const debugVoiceConfig = () => {
  console.log("🔍 Voice Configuration Debug:");
  console.log("Current timestamp:", new Date().toISOString());
  console.log("Available voices:", JSON.stringify(voices, null, 2));
  console.log("User agent:", navigator.userAgent);
  console.log("Current URL:", window.location.href);
  
  // Test all voice combinations
  Object.entries(voices).forEach(([voiceType, styles]) => {
    Object.entries(styles).forEach(([style, voiceId]) => {
      console.log(`${voiceType}-${style}: ${voiceId}`);
    });
  });
};

export const configureAssistant = (voice: string, style: string) => {
  // Call debug function
  debugVoiceConfig();
  
  console.log("🔧 configureAssistant called with:", { voice, style });
  console.log("🔧 Build timestamp:", process.env.NEXT_PUBLIC_BUILD_TIME || "not set");
  
  const voiceCategory = voices[voice as keyof typeof voices];
  const voiceId = voiceCategory?.[style as keyof typeof voiceCategory] || "oWAxZDx7w5VEj9dCyTzz";
  
  console.log("🔧 Selected voiceId:", voiceId);
  
  // Alert users if old voice ID somehow appears
  if (voiceId.includes("ZIlrSGI4jZgobxRKprJz") || voiceId.includes("2BJW5covhAzSr8STdHbE")) {
    console.error("❌ CRITICAL: Old voice ID detected!");
    alert("Please clear your browser cache and refresh the page.");
  }

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a highly knowledgable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.
        
        Tutor Guidelines:
        Stick to the given topic - {{topic}} and subject - {{subject}} and teach the student about it.
        Keep the conversation flowing smoothly while maintaining control.
        From time to time make sure that the student is following you and understands you.
        Break down the topic into smaller parts and teach the student one part at a time.
        Keep your style of conversation {{style}}.
        Keep your responses short, like in a real voice conversation.
        Do not include any special characters in your responses - this is a voice conversation.`
      }]
    },
  };
  
  console.log("🔧 Final voice ID being sent:", vapiAssistant.voice.voiceId);
  return vapiAssistant;
}