import type { Tag } from '../types';

export interface AiExtractionResult {
  tags: string[];
  description: string;
}


/**
 * Sends raw audio recording (Base64) + live TagsMaster context directly to Gemini 2.0 Flash API
 * Gemini 2.0 Flash natively transcribes the audio AND extracts structured tags & summary in 1 call!
 */
export const processAudioLogWithGemini = async (
  audioBase64: string,
  mimeType: string,
  availableTags: Tag[],
  _token?: string | null,
  apiKey?: string
): Promise<AiExtractionResult> => {
  if (!audioBase64 || audioBase64.trim().length === 0) {
    throw new Error('No audio recorded.');
  }

  const tagsContext = availableTags
    .map((t) => `- ${t.name}: ${t.description || 'General activity'}`)
    .join('\n');

  const systemInstruction = `You are an AI assistant for Life Logger, a personal daily journaling app.
Your task is to listen to the provided audio recording of the user's spoken voice note and:
1. Select all matching tag names from the provided TagsMaster list. ONLY select tag names that exist in the TagsMaster list! If none match, return an empty array.
2. Transcribe and summarize the user's voice note into a clean, well-formatted, professional daily journal entry (1-4 sentences).

TagsMaster Available Tags:
${tagsContext || '(No custom tags available)'}

IMPORTANT: Respond ONLY with a valid raw JSON object in this exact format, with no markdown code blocks or additional text:
{
  "tags": ["tag-name-1", "tag-name-2"],
  "description": "Clean summary of the user's notes..."
}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemInstruction },
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  };

  const keyToUse = apiKey?.trim() || localStorage.getItem('life_logger_gemini_api_key') || '';

  if (!keyToUse) {
    throw new Error('Missing Gemini API Key. Please paste your free API Key from aistudio.google.com in the Guide & Settings tab.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(keyToUse)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini AI audio processing failed.');
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  const validTagNames = availableTags.map((t) => t.name);
  const matchedTags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t: string) => validTagNames.includes(t))
    : [];

  return {
    tags: matchedTags,
    description: parsed.description || '',
  };
};
