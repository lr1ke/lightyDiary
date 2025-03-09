// import axios from "axios";

// const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

// // Convert audio to text using OpenAI Whisper API
// export const transcribeAudio = async (audioBlob, translate = false) => {
//   try {
//     const formData = new FormData();
//     formData.append("file", audioBlob, "recording.mp3");
//     formData.append("model", "whisper-1");
//     formData.append("language", "auto");

//     if (translate) {
//       formData.append("translate", "true"); // Translates to English
//     }

//     const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     return response.data.text; // Returns transcribed text
//   } catch (error) {
//     console.error("Error transcribing audio:", error);
//     return null;
//   }
// };


import axios from "axios";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;


export const transcribeAudio = async (audioBlob, translate = false) => {
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

    // **STEP 2: Translate Transcribed Text (if enabled)**
    if (translate) {
      console.log("Translating transcribed text...");
      const translationResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            { role: "system", content: "Translate the following text into English:" },
            { role: "user", content: transcribedText },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      transcribedText = translationResponse.data.choices[0].message.content.trim();
      console.log("Translated Text:", transcribedText);
    }

    return transcribedText; // ✅ Returns either transcribed or translated text
  } catch (error) {
    console.error("Error transcribing or translating audio:", error.response?.data || error.message);
    return null;
  }
};




// export const transcribeAudio = async (audioBlob, translate = false) => {
//   try {
//     const formData = new FormData();

//     // ✅ Convert Blob to File
//     const audioFile = new File([audioBlob], "recording.mp3", { type: "audio/mp3" });
//     formData.append("file", audioFile);
//     formData.append("model", "whisper-1");

//     // **STEP 1: Transcribe Audio to Original Language**
//     console.log("Transcribing audio...");
//     const transcriptionResponse = await axios.post(
//       "https://api.openai.com/v1/audio/transcriptions",
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );

//     let transcribedText = transcriptionResponse.data.text;
//     console.log("Transcribed Text:", transcribedText);

//     // **STEP 2: Translate Using Whisper (if translation is enabled)**
//     if (translate) {
//       console.log("Translating transcribed text to English...");
      
//       // ✅ Create new FormData for translation request
//       const translateFormData = new FormData();
//       translateFormData.append("file", audioFile);
//       translateFormData.append("model", "whisper-1");

//       const translationResponse = await axios.post(
//         "https://api.openai.com/v1/audio/translations",
//         translateFormData,
//         {
//           headers: {
//             Authorization: `Bearer ${OPENAI_API_KEY}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       transcribedText = translationResponse.data.text;
//       console.log("Translated Text:", transcribedText);
//     }

//     return transcribedText; // ✅ Returns either transcribed or translated text
//   } catch (error) {
//     console.error("Error transcribing or translating audio:", error.response?.data || error.message);
//     return null;
//   }
// };
