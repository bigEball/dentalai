/**
 * Client for Ollama's local LLM API.
 *
 * Ollama runs at http://localhost:11434 and exposes an OpenAI-compatible API.
 * We use the /api/generate endpoint for SOAP note generation and
 * /api/tags for health checks and model listing.
 */

import { getConfig } from '../../config';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    model: string;
    modified_at: string;
    size: number;
  }>;
}

// ----------------------------------------------------------------
// System prompt for dental SOAP notes
// ----------------------------------------------------------------

const DENTAL_SOAP_SYSTEM_PROMPT = `You are a clinical documentation assistant for a dental practice. Your job is to generate structured SOAP notes from transcribed provider-patient conversations.

Output EXACTLY four labeled sections. Use these exact headers on their own lines:

SUBJECTIVE:
OBJECTIVE:
ASSESSMENT:
PLAN:

Guidelines for each section:
- SUBJECTIVE: Patient's chief complaint, symptoms reported, relevant history, and pain descriptions from the conversation. Write in third person ("Patient reports...").
- OBJECTIVE: Clinical findings, exam results, vitals, test results, and observable conditions mentioned. Include tooth numbers, probing depths, and radiographic findings when mentioned.
- ASSESSMENT: Diagnosis, clinical impression, and differential diagnoses. Use standard dental terminology and include tooth numbers.
- PLAN: Treatment plan, prescriptions, follow-up schedule, referrals, and patient education. Number each item.

Keep each section concise but thorough. Use professional dental terminology. Do NOT include any text outside the four sections.`;

// ----------------------------------------------------------------
// Helper: get the Ollama base URL from config
// ----------------------------------------------------------------

function getOllamaUrl(): string {
  const config = getConfig();
  return config.ollama.url.replace(/\/+$/, '');
}

function getOllamaModel(): string {
  const config = getConfig();
  return config.ollama.model;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Generate a SOAP note from a dental procedure transcript using Ollama.
 *
 * Sends the transcript to the local LLM with a dental-specific system prompt
 * and parses the response into structured S/O/A/P sections.
 *
 * @param transcript - The transcribed audio from the dental procedure
 * @param patientName - Patient name to include in the prompt for context
 * @param procedureType - Optional procedure type for better context
 * @returns Parsed SOAP note with four sections
 */
export async function generateSOAPNote(
  transcript: string,
  patientName: string,
  procedureType?: string
): Promise<SOAPNote> {
  const baseUrl = getOllamaUrl();
  const model = getOllamaModel();

  const procedureContext = procedureType
    ? `\nProcedure type: ${procedureType}`
    : '';

  const userPrompt = `Generate a dental SOAP note from the following transcript.

Patient: ${patientName}${procedureContext}

Transcript:
${transcript}`;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: DENTAL_SOAP_SYSTEM_PROMPT,
      prompt: userPrompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 2048,
      },
    }),
    signal: AbortSignal.timeout(30_000), // 30 second timeout
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Ollama API error: ${response.status} ${response.statusText} — ${text}`);
  }

  const data = (await response.json()) as OllamaGenerateResponse;
  return parseSOAPResponse(data.response);
}

/**
 * Check whether Ollama is running and responsive.
 */
export async function isAvailable(): Promise<boolean> {
  try {
    const baseUrl = getOllamaUrl();
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * List all models currently available in the local Ollama instance.
 */
export async function listModels(): Promise<string[]> {
  const baseUrl = getOllamaUrl();
  const response = await fetch(`${baseUrl}/api/tags`, {
    method: 'GET',
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as OllamaTagsResponse;
  return (data.models ?? []).map((m) => m.name);
}

// ----------------------------------------------------------------
// Response parser
// ----------------------------------------------------------------

/**
 * Parse the raw LLM response text into four SOAP sections.
 *
 * Handles various formatting the LLM might use:
 *   - "SUBJECTIVE:" or "**SUBJECTIVE:**" or "## Subjective"
 *   - Sections may or may not have blank lines between them
 */
function parseSOAPResponse(raw: string): SOAPNote {
  const sectionPattern =
    /(?:\*{0,2}#{0,3}\s*)?(SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN)\s*:?\s*\*{0,2}/gi;

  const sections: { key: string; start: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(raw)) !== null) {
    sections.push({
      key: match[1]!.toLowerCase(),
      start: match.index + match[0].length,
    });
  }

  // Extract text between section headers
  const result: Record<string, string> = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  };

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const end = i + 1 < sections.length ? sections[i + 1]!.start - 20 : raw.length;
    // Grab text from after the header to just before the next header label
    const text = raw.slice(section.start, Math.max(section.start, end)).trim();
    // Remove any leading markdown artifacts
    result[section.key] = text.replace(/^[\s*#:-]+/, '').trim();
  }

  // If parsing failed completely, put the whole response in subjective
  if (!result.subjective && !result.objective && !result.assessment && !result.plan) {
    return {
      subjective: raw.trim(),
      objective: '',
      assessment: '',
      plan: '',
    };
  }

  return {
    subjective: result.subjective ?? '',
    objective: result.objective ?? '',
    assessment: result.assessment ?? '',
    plan: result.plan ?? '',
  };
}
