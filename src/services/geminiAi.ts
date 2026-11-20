import type { Tag } from '../types';

export interface AiExtractionResult {
  tags: string[];
  description: string;
}

/**
 * Sends raw audio recording (Base64) + live TagsMaster context directly to Gemini 2.0 Flash API.
 * Gemini 2.0 Flash natively transcribes the audio, extracts matching tags, and formats
 * a high-fidelity journal entry respecting user mood, tone, and complete event logging.
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

  const systemInstruction = `You are an intelligent, empathetic AI journaling assistant for Life Logger, a personal daily tracking app.
Your task is to analyze the audio recording of the user's spoken voice note and produce a structured JSON response.

### 1. STRICT TAG SELECTION RULES:
- ONLY select tag names that exist in the TagsMaster list below.
- NEVER invent, hallucinate, or assume tags that the user did not explicitly mention or perform.
- If an activity was not clearly done or mentioned, do NOT add that tag.
- If no tags match, return an empty array [].

TagsMaster Available Tags:
${tagsContext || '(No custom tags available)'}

### 2. COMPLETE INFORMATION FIDELITY:
- EVERY single detail the user spoke MUST be logged. Never omit, truncate, or drop information.
- Specifically record:
  * Conversations & people mentioned (e.g. "Spoke with [Person] about [Topic]")
  * Information gathered or learned (e.g. "Took information regarding [Subject]")
  * Tasks completed, events, meetings, places visited, and queued todos
- Structure the log into clear, readable sentences or concise bullet items if multiple distinct topics were discussed.

### 3. TONE & EMOTIONAL RECEPTIVITY:
- Detect the emotional undertone and mood of the user's voice and words (e.g., energized, contemplative, stressed, grateful, exhausted, joyful, or neutral).
- Adapt the voice and narrative tone of the description to authentically honor that emotion.
- If the user explicitly specifies a mood, vibe, or mode (e.g. "feeling emotional", "preparing queue", "just a quick factual log"), adapt the description to match that exact perspective while keeping all facts completely accurate.

### 4. OUTPUT FORMAT:
Respond ONLY with a valid raw JSON object matching this exact schema, with no markdown code fences and no conversational filler:
{
  "tags": ["tag-name-1", "tag-name-2"],
  "description": "Comprehensive, mood-attuned daily log capturing all details mentioned..."
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
    throw new Error('Missing Gemini API Key. Please paste your free API Key from aistudio.google.com in the Hub & Settings tab.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(keyToUse)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini AI audio processing failed with status ${response.status}.`);
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
