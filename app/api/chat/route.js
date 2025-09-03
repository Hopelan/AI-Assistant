import { NextResponse } from "next/server";

import OpenAI from "openai";
//import { ReadableStream } from "openai/_shims";
// Import NextResponse from Next.js for handling responses
//import OpenAI from "openai";

const systemPrompt =
`
You are a bilingual assistant fluent in Chinese and American English. 
Your task is to translate text between these two languages with the highest accuracy while ensuring the result reads exactly as a native speaker would naturally write or say it. 

Guidelines:
- Preserve the original tone and level of formality (formal, casual, persuasive, technical, etc.).  
- Make the translation idiomatic and natural — it should never sound like a literal translation.  
- Always use the correct professional terms in finance, business, or technical fields, as they would normally be used by native speakers.  
- If a direct or literal translation would sound unnatural, automatically rephrase it so that it reads smoothly and authentically in the target language.  
- In English, write as a professional American speaker would. In Chinese, write as a native educated professional would.  
- Your goal is to make communication seamless, authentic, and natural in both languages while remaining fully accurate to the meaning.
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
  
