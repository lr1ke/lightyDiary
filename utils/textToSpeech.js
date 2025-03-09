// problems: the voice adds words to make text sound better, more coherent, not wanted!
// takes too long to load
// try: better separate the tranlate and read aloud functions, the tranlate button in the row under the content 
// also translate not needed in personalComp but in collab and global, also in collab and global for every entry voice switch  


import axios from "axios";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const audioCache = new Map(); // Store cached audio

const ALL_VOICES = ["alloy", "nova", "echo", "fable", "onyx", "shimmer"]; // OpenAI voices

const LANGUAGES = {
  en: { name: "English" },
  de: { name: "German" },
  es: { name: "Spanish" },
  fr: { name: "French" },
  ru: { name: "Russian" },
  zh: { name: "Chinese (Mandarin)" },
  hi: { name: "Hindi" },
  ar: { name: "Arabic" },
  tr: { name: "Turkish" },
  it: { name: "Italian" },
  pt: { name: "Portuguese" },
};

// **Detect text language**
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

// Randomly select a voice for each entry
const getRandomVoice = () => {
  return ALL_VOICES[Math.floor(Math.random() * ALL_VOICES.length)];
};

// **Translate text using OpenAI GPT**
const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: `Translate the following text into ${targetLang}. 
                     Maintain all original spacing, punctuation, and formatting.
                     Do not modify, normalize, or correct the text in any way besides translation.` 
          },
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
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation Error:", error);
    return text; // Fallback to original text if translation fails
  }
};

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
      if (timeoutId) {
          clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
          func(...args);
      }, delay);
  };
};

// **Handle Mouse Enter Function**
export const handleMouseEnter = debounce(async (content, translateTo) => {
  const cacheKey = `${content}-${translateTo}`;
  if (audioCache.has(cacheKey)) {
      console.log("Audio already preloaded from cache");
      return; // Skip if already cached
  }
  console.log(`Preloading audio for content: ${content} with translation: ${translateTo}...`);
      // Validate content
      if (!content || content.trim() === "") {
        console.error("Content is empty or invalid.");
        return; // Exit early if content is invalid
    }
        // Get a random voice
        const selectedVoice = getRandomVoice();
        console.log("Selected voice:", selectedVoice);

  try {
      // Fetch audio data from your API
      const response = await axios.post("https://api.openai.com/v1/audio/speech", {
          model: "tts-1-hd", 
          input: content, 
          voice: selectedVoice, 
          response_format: "mp3",
          speed: 1.0
      }, {
          headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
          },
          responseType: "arraybuffer", // Expecting binary data
      });

      // Create a Blob from the response data
      const audioBlob = new Blob([response.data], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Store the audio URL in the cache
      audioCache.set(cacheKey, audioUrl);
      console.log("Audio preloaded and cached successfully.");
    } catch (error) {
      console.log("Error preloading audio.");
  }
}, 3000); // 3 seconds delay

// **Preload Audio Function**
const preloadAudio = (text, selectedVoice) => {
  const cacheKey = `${text}-${selectedVoice}`;
  if (audioCache.has(cacheKey)) {
    console.log("Audio already preloaded from cache");
    return audioCache.get(cacheKey);
  }
  console.log(`Preloading audio for voice ${selectedVoice}...`);
  // Logic to preload audio can be added here if needed
  return null; // Return null if not preloaded
};

// **Read Aloud Function (with Translation)**
export const readEntryContent = async (text, translateTo = null) => {
  const detectedLang = detectLanguage(text);
  const selectedVoice = getRandomVoice(); // Pick a random voice

  let finalText = text;

  // Preload audio if needed
  // preloadAudio(finalText, selectedVoice); // This line is commented out, ensure it's not needed

  // 🛑 **Only translate if explicitly requested**
  if (translateTo && translateTo !== detectedLang) {
    console.log(`Translating text from ${detectedLang} to ${translateTo}...`);
    finalText = await translateText(text, translateTo);
  }

  // Check cache first
  const cacheKey = `${finalText}-${selectedVoice}`;
  if (audioCache.has(cacheKey)) {
    console.log("Playing cached audio");
    const audio = new Audio(audioCache.get(cacheKey));
    audio.play();
    return;
  }

  try {
    console.log(`Fetching new audio with voice ${selectedVoice}...`);
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      {
        model: "tts-1-hd", // Use HD model for better accuracy
        input: finalText,
        voice: selectedVoice,
        response_format: "mp3",
        speed: 1.0
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
    
    // Cache the audio
    audioCache.set(cacheKey, audioUrl);
    
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error("Error generating speech:", error);
    console.error("Error details:", error.response?.data ? 
      new TextDecoder().decode(error.response.data) : error.message);
  }
};