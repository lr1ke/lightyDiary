import axios from "axios";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const LANGUAGES = {
  en: { name: "English", voice: "alloy" },
  de: { name: "German", voice: "nova" },
  es: { name: "Spanish", voice: "echo" },
  fr: { name: "French", voice: "shimmer" },
  ru: { name: "Russian", voice: "nova" },
  zh: { name: "Chinese (Mandarin)", voice: "alloy" },
  hi: { name: "Hindi", voice: "fable" },
  ar: { name: "Arabic", voice: "onyx" },
  tr: { name: "Turkish", voice: "nova" },
  it: { name: "Italian", voice: "fable" },
  pt: { name: "Portuguese", voice: "echo" },
};

// Detect language from text
const detectLanguage = (text) => {
  if (text.match(/[äöüß]/i)) return "de";
  if (text.match(/[áéíóúñ]/i)) return "es";
  if (text.match(/[àâêîôûç]/i)) return "fr";
  if (text.match(/[А-яЁё]/i)) return "ru";
  if (text.match(/[\u4e00-\u9fff]/)) return "zh";
  if (text.match(/[ऀ-ॿ]/)) return "hi";
  if (text.match(/[ء-ي]/)) return "ar";
  if (text.match(/[çşğüöı]/i)) return "tr";
  if (text.match(/[àèéìòù]/i)) return "it";
  if (text.match(/[ãõç]/i)) return "pt";
  return "en"; // Default English
};

// Translate text using OpenAI GPT
export const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: `Translate the following text into ${targetLang}.` },
          { role: "user", content: text },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Translation Error:", error);
    return text; // Fallback to original text if translation fails
  }
};

// Read aloud text using OpenAI TTS
export const readEntryContent = async (text, voiceSpeed = "default", targetLang = null) => {
  const detectedLang = detectLanguage(text);
  const finalLang = targetLang || detectedLang;
  const selectedVoice = LANGUAGES[finalLang]?.voice || "alloy"; // Default OpenAI voice

  if (targetLang && targetLang !== detectedLang) {
    text = await translateText(text, targetLang);
  }

  const ssmlText = `
    <speak>
      <prosody rate="${voiceSpeed === 'slow' ? '80%' : voiceSpeed === 'fast' ? '120%' : '100%'}">
        ${text}
      </prosody>
    </speak>
  `;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1",
        input: ssmlText,
        voice: selectedVoice
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const audioBlob = new Blob([response.data], { type: "audio/mp3" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error("Error generating speech:", error);
  }
};

