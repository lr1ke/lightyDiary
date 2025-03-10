
import axios from "axios";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;


export const transcribeAudio = async (audioBlob) => {
  try {
    const formData = new FormData();

    // ✅ Convert Blob to File
    const audioFile = new File([audioBlob], "recording.mp3", { type: "audio/mp3" });
    formData.append("file", audioFile);
    formData.append("model", "whisper-1");

    // **STEP 1: Transcribe Audio to Text**
    console.log("Transcribing audio...");
    const transcriptionResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
    });

    let transcribedText = transcriptionResponse.data.text;
    console.log("Transcribed Text:", transcribedText);

    // // **STEP 2: Translate Transcribed Text (if enabled)**
    // if (translate) {
    //   console.log("Translating transcribed text...");
    //   const translationResponse = await axios.post(
    //     "https://api.openai.com/v1/chat/completions",
    //     {
    //       model: "gpt-4",
    //       messages: [
    //         { role: "system", content: "Translate the following text into English:" },
    //         { role: "user", content: transcribedText },
    //       ],
    //     },
    //     {
    //       headers: {
    //         Authorization: `Bearer ${OPENAI_API_KEY}`,
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );

    //   transcribedText = translationResponse.data.choices[0].message.content.trim();
    //   console.log("Translated Text:", transcribedText);
    // }

    return transcribedText; 
  } catch (error) {
    console.error("Error transcribing or translating audio:", error.response?.data || error.message);
    return null;
  }
};




