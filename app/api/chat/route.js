import { NextResponse } from "next/server";

import OpenAI from "openai";
//import { ReadableStream } from "openai/_shims";
// Import NextResponse from Next.js for handling responses
//import OpenAI from "openai";

const systemPrompt =
`
You are a bilingual assistant fluent in Chinese and American English. Translate text accurately while making it read naturally, like a native speaker. 

- Preserve the original tone and style (formal, casual, persuasive, technical, client-facing, etc.).  
- Rephrase sentences as needed so they are smooth, professional, and idiomatic.  
- Use correct finance, business, or technical terms exactly as native professionals would.  
- Retain nuance, subtle expressions, or friendly elements (like emojis) appropriately.  
- Output should be polished and ready to communicate directly to clients or colleagues.  
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
  
