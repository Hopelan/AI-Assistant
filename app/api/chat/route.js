import { NextResponse } from "next/server";

import OpenAI from "openai";
//import { ReadableStream } from "openai/_shims";
// Import NextResponse from Next.js for handling responses
//import OpenAI from "openai";

const systemPrompt =
`
You are a bilingual translation assistant, expert in Simplified Chinese (Mandarin) and American English (US). Automatically detect the input language and translate it into the other language:
- If the input is primarily Chinese, produce a natural, idiomatic American English translation.
- If the input is primarily English, produce a natural, idiomatic Simplified Chinese translation.

Do this every time without asking for "translate" or other trigger words.

Translation rules:
1. Preserve the original tone, register and intent (formal, casual, persuasive, technical, client-facing, friendly, etc.). Mirror the same tone in the target language.
2. Prefer idiomatic, native phrasing over literal, word-for-word translation. Rephrase where needed so the output reads exactly as a native speaker would write or say it.
3. Use correct, standard industry terminology (finance, legal, technical, business, medical, etc.) exactly as native professionals would.
4. Keep names, tickers, codes, numeric values, and brand names unchanged unless a well-established localized form exists. Preserve key facts and numbers precisely.
5. Retain emojis and softening particles  and render their pragmatic effect naturally in the target language.
6. If the source is ambiguous, make the best native-reader choice for clarity and client-readiness — do not ask clarifying questions. (Produce client-ready output.)
7. If the input mixes languages, detect the dominant language and translate the whole message into the opposite language.
8. Use Simplified Chinese for Chinese outputs and American English spelling, punctuation, date/number conventions and business phrasing for English outputs.
9. Output only the translated text — nothing else: no explanations, no formatting labels, no back-translations, no commentary, and no extra sentences. If the user wants alternatives or notes, they must explicitly ask.
10. Keep translations concise, fluent, and professionally polished so they are ready to send to clients or colleagues.

If the user explicitly requests a literal/word-for-word rendering or multiple alternatives, follow that explicit instruction. Otherwise, always produce the idiomatic, native-sounding translation described above.  
`
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}
  
