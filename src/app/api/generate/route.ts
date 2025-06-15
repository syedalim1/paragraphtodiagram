import { supabase } from "@/lib/supabaseClient";
import { auth } from "@clerk/nextjs/server"; // Updated import for server-side auth
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Configuration ---
const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20";
// No explicit endpoint needed with the SDK, it handles it internally
const VALID_DIAGRAM_TYPES = [
  "er_diagram", // Entity Relationship Diagram
  "flowchart", // Can be used for DFD (Data Flow Diagram)
  "class_diagram", // Can be used for UML Diagram (UML has many types, class is common)
];
const MAX_INPUT_TEXT_LENGTH = 5000; // Max characters for the input text

// --- Type Definitions ---
interface RequestBody {
  text: string;
  diagramType: string; // This will be the ID, e.g., "er_diagram"
  diagramTypeName: string; // This will be the full name, e.g., "ER Diagram"
  // title?: string; // Optional: Allow client to suggest a title
}

interface Analysis {
  summary: string;
  flowPoints: string[];
  arrowMeanings: Record<string, string>;
  // Add other analysis fields you expect
}

interface ParsedLLMOutput {
  mermaidCode?: string;
  analysis?: Analysis;
  error?: string; // If the LLM itself indicates an error
}

// --- Helper Functions ---
function generateErrorResponse(
  message: string,
  status: number,
  details?: unknown
) {
  console.error(`Error: ${message}`, details || "");
  return new NextResponse(JSON.stringify({ error: message, details }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// --- API Route ---
export async function POST(req: Request) {
  // 1. Authentication
  const { userId } = await auth();
  if (!userId) {
    return generateErrorResponse("Unauthorized", 401);
  }

  // 2. Environment Variable Check
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set.");
    return generateErrorResponse(
      "Server configuration error: Missing Gemini API key.",
      500
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // 3. Request Body Parsing and Validation
  let requestBody: RequestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    return generateErrorResponse("Invalid JSON in request body.", 400, {
      error,
    });
  }

  const { text, diagramType, diagramTypeName } = requestBody;

  if (!text || typeof text !== "string" || text.trim() === "") {
    return generateErrorResponse('Missing or invalid "text" field.', 400);
  }
  if (text.length > MAX_INPUT_TEXT_LENGTH) {
    return generateErrorResponse(
      `Input text exceeds maximum length of ${MAX_INPUT_TEXT_LENGTH} characters.`,
      400
    );
  }
  if (
    !diagramType ||
    typeof diagramType !== "string" ||
    diagramType.trim() === ""
  ) {
    return generateErrorResponse(
      'Missing or invalid "diagramType" (ID) field.',
      400
    );
  }
  if (
    !diagramTypeName ||
    typeof diagramTypeName !== "string" ||
    diagramTypeName.trim() === ""
  ) {
    return generateErrorResponse(
      'Missing or invalid "diagramTypeName" (Display Name) field.',
      400
    );
  }
  // VALID_DIAGRAM_TYPES should contain the IDs (e.g., "er_diagram")
  if (!VALID_DIAGRAM_TYPES.includes(diagramType.toLowerCase())) {
    return generateErrorResponse(
      `Invalid "diagramType" ID. Supported types are: ${VALID_DIAGRAM_TYPES.join(
        ", "
      )}.`,
      400,
      { receivedType: diagramType }
    );
  }

  // 4. Call DeepSeek API
  // Use diagramTypeName for the prompt as it's more descriptive for the AI
  const prompt = `
    Generate a ${diagramTypeName.toUpperCase()} diagram in Mermaid.js syntax and provide an analysis
    based on the following text: "${text}".

    The output MUST be a single, valid JSON object with the following structure:
    {
      "mermaidCode": "YOUR_MERMAID_CODE_HERE (string, without markdown backticks or 'mermaid' keyword)",
      "analysis": {
        "summary": "A concise paragraph summarizing the diagram and its purpose based on the input text.",
        "flowPoints": ["Key element or step 1 described", "Key element or step 2 described", "..."],
        "arrowMeanings": {"A-->B": "Description of what A to B represents", "C-.->D": "Description of C to D"}
      }
    }

    Important Rules:
    - The "mermaidCode" value should be ONLY the Mermaid syntax (e.g., "graph TD; A-->B;"). Do NOT include \`\`\`mermaid or \`\`\`.
    - The "analysis.flowPoints" should be an array of strings, describing key components or steps.
    - The "analysis.arrowMeanings" should be an object where keys are Mermaid arrows (e.g., "X-->Y") and values are their explanations.
    - Ensure the entire response is a single, valid JSON object. Do not add any text before or after the JSON object.
    - If you cannot generate a meaningful diagram or analysis from the text, respond with:
      { "error": "Unable to generate diagram from the provided text." }
    `;

  let geminiResponse;
  let content: string | undefined;
  try {
    const result = await model.generateContent(prompt);
    geminiResponse = await result.response;
    content = geminiResponse.text(); // Gemini's response is directly accessible via .text()
  } catch (error: unknown) {
    let errorMessage = "Unknown error during Gemini API communication.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    return generateErrorResponse(
      "Failed to communicate with Gemini API.",
      503,
      {
        error: errorMessage,
        userId,
      }
    );
  }

  // 5. Process Gemini API Response
  if (!content) {
    return generateErrorResponse("No content in Gemini API response.", 500, {
      geminiResponse,
      userId,
    });
  }

  let parsedOutput: ParsedLLMOutput;
  try {
    // Gemini might return markdown, so we need to strip it if present
    const jsonString = content.replace(/^```json\s*|\s*```$/g, "").trim();
    parsedOutput = JSON.parse(jsonString);
  } catch (e: unknown) {
    let errorMessage =
      "Unknown error during JSON parsing from Gemini response.";
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === "string") {
      errorMessage = e;
    }
    console.error(
      "Failed to parse JSON from Gemini response. Content:",
      content,
      "Error:",
      errorMessage,
      { userId }
    );
    // Fallback: Try to extract Mermaid code if JSON parsing fails and content seems to have it
    const diagramCodeMatch = content.match(
      /graph TD;|flowchart TD;|sequenceDiagram;|classDiagram;|stateDiagram;|erDiagram;|journey;|gantt|pie|mindmap[\s\S]*/i
    );
    const diagramCode = diagramCodeMatch ? diagramCodeMatch[0].trim() : "";

    if (diagramCode) {
      console.warn(
        "Falling back to regex extraction for mermaid code due to JSON parse failure.",
        { userId }
      );
      parsedOutput = {
        mermaidCode: diagramCode,
        analysis: {
          summary:
            "Analysis JSON parsing failed. Displaying raw diagram if possible.",
          flowPoints: [],
          arrowMeanings: {},
        },
      };
    } else {
      return generateErrorResponse(
        "Failed to parse analysis from AI. The AI response was not valid JSON. Ensure the AI returns only a JSON object.",
        500,
        {
          responseContent: content.substring(0, 500),
          error: errorMessage,
          userId,
        }
      );
    }
  }

  if (parsedOutput.error) {
    return generateErrorResponse(
      `AI could not process the request: ${parsedOutput.error}`,
      422,
      { userId }
    );
  }

  const { mermaidCode, analysis } = parsedOutput;

  if (
    !mermaidCode ||
    typeof mermaidCode !== "string" ||
    mermaidCode.trim() === ""
  ) {
    // This could happen if the LLM fails to generate code but doesn't use the "error" field.
    return generateErrorResponse("AI failed to generate diagram code.", 500, {
      responseContent: content.substring(0, 500), // Log a snippet
      userId,
    });
  }

  const finalAnalysis: Analysis = {
    summary:
      analysis?.summary ||
      `Diagram based on input: "${text.substring(0, 100)}${
        text.length > 100 ? "..." : ""
      }"`,
    flowPoints: analysis?.flowPoints || [],
    arrowMeanings: analysis?.arrowMeanings || {},
    ...(analysis || {}), // Spread any other fields from analysis
  };

  // 6. Save to Supabase
  const diagramTitle =
    finalAnalysis.summary.length > 10 && finalAnalysis.summary.length < 150
      ? finalAnalysis.summary
      : `Diagram: ${text.substring(0, 50)}${text.length > 50 ? "..." : ""}`;

  const { error: supabaseError, data: insertedData } = await supabase
    .from("diagrams")
    .insert({
      user_id: userId,
      description: text, // Original input text
      title: diagramTitle,
      diagram_type: diagramType.toLowerCase(),
      diagram_code: mermaidCode,
      analysis: finalAnalysis, // Store the structured analysis
      // raw_ai_response: content, // Optional: store the raw AI response for debugging
    })
    .select("id") // Optionally return the ID of the newly created diagram
    .single();

  if (supabaseError) {
    return generateErrorResponse(
      `Supabase error: ${supabaseError.message}`,
      500,
      {
        details: supabaseError.details,
        userId,
      }
    );
  }

  // 7. Return Response
  return NextResponse.json({
    message: "Diagram generated successfully.",
    diagramId: insertedData?.id, // If you selected the id
    diagramCode: mermaidCode,
    analysis: finalAnalysis,
  });
}
