// Generates flashcards from an uploaded lecture PDF using Google Gemini (free tier).
// Invoked by the app with the user's JWT; RLS ensures users only touch their own materials.
import { createClient } from 'npm:@supabase/supabase-js@2'

const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
const MAX_PDF_BYTES = 15 * 1024 * 1024

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

interface Card { question: string; answer: string }

function toBase64(bytes: Uint8Array): string {
  let s = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(s)
}

async function askGemini(pdf: Uint8Array, count: number): Promise<Card[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: 'application/pdf', data: toBase64(pdf) } },
          { text: `You are helping a student study. Read this lecture and write ${count} flashcards covering the most important concepts, definitions and facts. Questions must be clear and self-contained; answers concise (1-3 sentences). Skip administrative content like grading policies.` },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { question: { type: 'STRING' }, answer: { type: 'STRING' } },
            required: ['question', 'answer'],
          },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  const cards = JSON.parse(text) as Card[]
  return cards.filter((c) => c.question?.trim() && c.answer?.trim()).slice(0, count)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!GEMINI_KEY) return json({ error: 'GEMINI_API_KEY is not configured' }, 500)

  const auth = req.headers.get('Authorization') ?? ''
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { materialId, count = 15 } = await req.json().catch(() => ({}))
  if (!materialId) return json({ error: 'materialId required' }, 400)

  const { data: material } = await supabase.from('study_materials').select('*').eq('id', materialId).single()
  if (!material) return json({ error: 'Material not found' }, 404)
  if (material.size_bytes > MAX_PDF_BYTES) return json({ error: 'PDF is too large (max 15 MB)' }, 400)

  const { data: file, error: dlErr } = await supabase.storage.from('materials').download(material.storage_path)
  if (dlErr || !file) return json({ error: dlErr?.message ?? 'Could not download PDF' }, 500)

  let cards: Card[]
  try {
    cards = await askGemini(new Uint8Array(await file.arrayBuffer()), Math.min(Math.max(Number(count) || 15, 5), 40))
  } catch (e) {
    return json({ error: (e as Error).message }, 502)
  }
  if (!cards.length) return json({ error: 'No flashcards could be generated from this PDF' }, 422)

  const rows = cards.map((c) => ({
    user_id: user.id,
    course_id: material.course_id,
    material_id: material.id,
    question: c.question.trim(),
    answer: c.answer.trim(),
  }))
  const { data: inserted, error: insErr } = await supabase.from('flashcards').insert(rows).select()
  if (insErr) return json({ error: insErr.message }, 500)

  return json({ cards: inserted })
})
