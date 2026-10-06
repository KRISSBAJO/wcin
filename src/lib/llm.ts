// Text drafting for the admin. Uses Claude through the Anthropic SDK when ANTHROPIC_API_KEY is set,
// otherwise OpenAI's chat API when OPENAI_API_KEY is set. Returns parsed JSON.
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

export type TextProvider = 'anthropic' | 'openai' | null;

export function textProvider(): TextProvider {
  if (env('ANTHROPIC_API_KEY')) return 'anthropic';
  if (env('OPENAI_API_KEY')) return 'openai';
  return null;
}

export class LlmError extends Error {}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new LlmError('The model did not return JSON.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new LlmError('The model returned JSON that could not be read.');
  }
}

/** Asks the model for a JSON object. `system` describes the job and the exact keys expected. */
export async function draftJson(system: string, user: string): Promise<Record<string, unknown>> {
  const provider = textProvider();
  if (!provider) throw new LlmError('Add ANTHROPIC_API_KEY or OPENAI_API_KEY to the server environment to use AI drafting.');

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: env('ANTHROPIC_API_KEY') });
    const response = await client.messages.create({
      model: env('ANTHROPIC_MODEL') || 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      system: `${system}\n\nReply with a single JSON object and nothing else.`,
      messages: [{ role: 'user', content: user }],
    });
    if (response.stop_reason === 'refusal') throw new LlmError('The model declined this request.');
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return extractJson(text) as Record<string, unknown>;
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('OPENAI_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env('OPENAI_TEXT_MODEL') || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${system}\n\nReply with a single JSON object and nothing else.` },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new LlmError(`OpenAI responded ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`);
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return extractJson(body.choices?.[0]?.message?.content ?? '') as Record<string, unknown>;
}
