// import { supabase } from '@/lib/supabaseClient'; // Not used in this route
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { idea, context } = await req.json();

  if (!idea || !context) {
    return new NextResponse("Missing idea or context", { status: 400 });
  }

  // Call DeepSeek API to enhance the prompt
  try {
    const deepSeekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Or your preferred model
        messages: [{
          role: "user",
          content: `You are an AI assistant helping users formulate detailed prompts for diagram generation.
The user has a rough idea: "${idea}".
The context for this idea is: "${context}".
Based on this, generate a more detailed and effective prompt that can be used to generate the diagram.
The refined prompt should be clear, specific, and provide enough detail for a diagramming AI to work effectively.
Return *only* the refined prompt text, without any preamble or explanation. For example, if the idea is "user login" and context is "for a flowchart", a good response would be "A flowchart detailing the steps a user takes to log into a web application, including success and failure paths."`
        }],
        temperature: 0.7, // Adjust as needed for creativity vs. precision
        max_tokens: 200, // Adjust as needed
      })
    });

    if (!deepSeekRes.ok) {
      const errorBody = await deepSeekRes.text();
      console.error("DeepSeek API Error (enhance-prompt):", deepSeekRes.status, errorBody);
      return new NextResponse(`Error from DeepSeek API: ${deepSeekRes.statusText}`, { status: deepSeekRes.status });
    }

    const deepSeekData = await deepSeekRes.json();
    const suggestedPrompt = deepSeekData.choices[0]?.message?.content?.trim();

    if (!suggestedPrompt) {
      console.error("No suggested prompt in DeepSeek API response (enhance-prompt):", deepSeekData);
      return new NextResponse("Failed to get suggestion from DeepSeek API", { status: 500 });
    }

    return NextResponse.json({ suggestedPrompt });

  } catch (error: unknown) {
    console.error("Error in /api/enhance-prompt:", error);
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    return new NextResponse(`Internal Server Error: ${message}`, { status: 500 });
  }
}