/**
 * OpenRouter integration. Called only from the backend — the API key
 * never reaches the frontend. The AI explains an ALREADY-calculated risk
 * score; it never computes or changes the score itself.
 */

const SYSTEM_PROMPT = `You are an academic decision-support assistant for a college early-warning system.
Use ONLY the academic metrics provided in the input JSON.
Do not invent facts about the student.
Do not infer or mention personal, medical, financial, psychological, family, religious, caste, or other sensitive circumstances.
Do not diagnose health conditions.
Do not change, recalculate, or contradict the provided risk score or risk level.
Do not predict guaranteed failure or guaranteed success — this is decision support, not a certainty.
If a metric indicates insufficient data, mention that plainly instead of guessing.
Keep recommendations academically appropriate and actionable for a faculty member or student to act on.
Respond with ONLY valid JSON, no markdown fences, no extra commentary, matching exactly this shape:
{
  "summary": "one concise 1-2 sentence summary",
  "mainReasons": ["reason 1", "reason 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
summary must be a single string. mainReasons must have 2 to 4 items. recommendations must have 2 to 4 items.`;

function buildUserPrompt(payload) {
  return `Academic data (JSON):\n${JSON.stringify(payload, null, 2)}\n\nReturn the structured JSON explanation now.`;
}

/** Best-effort extraction of a JSON object from a possibly messy LLM response. */
function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}

function normalize(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  const summary = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : null;

  const mainReasons = Array.isArray(parsed.mainReasons)
    ? parsed.mainReasons.filter((r) => typeof r === 'string' && r.trim()).slice(0, 4)
    : [];

  const recommendations = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.filter((r) => typeof r === 'string' && r.trim()).slice(0, 4)
    : [];

  if (!summary || mainReasons.length === 0 || recommendations.length === 0) return null;

  return { summary, mainReasons, recommendations };
}

/**
 * Calls OpenRouter with the structured risk payload.
 * Returns { success: true, explanation } or { success: false, reason }.
 * Never throws — callers must be able to degrade gracefully per spec
 * ("AI explanation is temporarily unavailable").
 */
async function generateRiskExplanation(payload) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;

  if (!apiKey || !model) {
    return { success: false, reason: 'AI is not configured on this server (missing OPENROUTER_API_KEY/OPENROUTER_MODEL).' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'SmartEdu Tracker',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(payload) },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { success: false, reason: `OpenRouter request failed (${response.status}): ${errText.slice(0, 200)}` };
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(rawContent);
    const normalized = normalize(parsed);

    if (!normalized) {
      return { success: false, reason: 'AI response could not be parsed into the expected structured format.' };
    }

    return { success: true, explanation: normalized };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'AI request timed out.' : `AI request failed: ${err.message}`;
    return { success: false, reason };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { generateRiskExplanation, SYSTEM_PROMPT };
