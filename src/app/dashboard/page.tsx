"use client";
import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import MermaidDiagram from "../../components/MermaidDiagram";

interface AnalysisResult {
  summary: string;
  diagramType: string;
  diagramCode: string;
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [inputText, setInputText] = useState("");
  const [editedDiagram, setEditedDiagram] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [diagramType, setDiagramType] = useState("flowchart");
  const mermaidRef = useRef<HTMLDivElement>(null);

  const diagramTypes = [
    { id: "er_diagram", name: "ER Diagram" },
    { id: "flowchart", name: "DFD (Data Flow Diagram)" },
    { id: "class_diagram", name: "UML Diagram (Class)" },
  ];

  const getDiagramTypeName = (id: string): string => {
    const selectedType = diagramTypes.find((dt) => dt.id === id);
    if (selectedType) {
      return selectedType.name;
    }
    return id
      .replace(/_([a-z])/g, (g) => ` ${g[1].toUpperCase()}`)
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const generateDiagram = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to generate a diagram.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const textToProcess = enhancePrompt
        ? `Generate a ${getDiagramTypeName(
            diagramType
          )} diagram in Mermaid syntax for: ${inputText}`
        : inputText;

      const currentDiagramTypeName = getDiagramTypeName(diagramType);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToProcess,
          diagramType: diagramType,
          diagramTypeName: currentDiagramTypeName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate diagram");
      }

      const result = await response.json();
      setAnalysis(result);
      setEditedDiagram(result.diagramCode);
      setIsLoading(false);

      setHistory((prev) => [
        { ...result, diagramType: diagramType },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      console.error("Error generating diagram:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while generating the diagram"
      );
      setIsLoading(false);
    }
  };

  const downloadDiagram = async () => {
    if (!editedDiagram.trim()) {
      setError("No diagram to download. Please generate a diagram first.");
      return;
    }

    if (!mermaidRef.current) {
      setError("Diagram container is not available. Cannot find SVG.");
      return;
    }

    // Wait for the diagram to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    const svgElement = mermaidRef.current.querySelector("svg");
    if (!svgElement) {
      setError(
        "Could not find the diagram SVG element. The diagram might not have rendered correctly."
      );
      return;
    }

    try {
      // Create a title for the file
      const title =
        analysis?.summary
          ?.substring(0, 30)
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase() || "diagram";

      // Clone and prepare the SVG
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;

      // Get the bounding box for proper dimensions
      const bbox = svgElement.getBBox();
      const padding = 20;
      const width = bbox.width + padding * 2;
      const height = bbox.height + padding * 2;

      // Clean the SVG to avoid tainted canvas issues
      // Remove any external references and problematic attributes
      const cleanSvg = (element: Element) => {
        // Remove href attributes that might cause CORS issues
        if (element.hasAttribute("href")) {
          element.removeAttribute("href");
        }
        if (element.hasAttribute("xlink:href")) {
          element.removeAttribute("xlink:href");
        }

        // Process child elements
        Array.from(element.children).forEach((child) => cleanSvg(child));
      };

      cleanSvg(clonedSvg);

      // Set proper attributes on the cloned SVG
      clonedSvg.setAttribute("width", width.toString());
      clonedSvg.setAttribute("height", height.toString());
      clonedSvg.setAttribute(
        "viewBox",
        `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`
      );
      clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

      // Add a white background
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      rect.setAttribute("x", (bbox.x - padding).toString());
      rect.setAttribute("y", (bbox.y - padding).toString());
      rect.setAttribute("width", width.toString());
      rect.setAttribute("height", height.toString());
      rect.setAttribute("fill", "white");
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);

      // Remove or replace any problematic style elements
      const styleElements = clonedSvg.querySelectorAll("style");
      styleElements.forEach((styleEl) => {
        if (styleEl.textContent) {
          // Remove @import rules and external font references
          let cleanedStyles = styleEl.textContent
            .replace(/@import[^;]+;/g, "")
            .replace(/@font-face[^}]+}/g, "")
            .replace(/url\([^)]+\)/g, "");

          styleEl.textContent =
            cleanedStyles +
            `
            text, .nodeLabel, .edgeLabel {
              font-family: Arial, sans-serif !important;
              font-size: 14px !important;
            }
          `;
        }
      });

      // Add safe inline styles
      const style = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style"
      );
      style.textContent = `
        text {
          font-family: Arial, sans-serif !important;
          font-size: 14px !important;
          fill: #000 !important;
        }
        .nodeLabel, .edgeLabel {
          font-family: Arial, sans-serif !important;
          font-size: 14px !important;
          fill: #000 !important;
        }
      `;

      const defs =
        clonedSvg.querySelector("defs") ||
        document.createElementNS("http://www.w3.org/2000/svg", "defs");
      if (!clonedSvg.querySelector("defs")) {
        clonedSvg.insertBefore(defs, clonedSvg.firstChild);
      }
      defs.appendChild(style);

      // Convert SVG to data URL with proper encoding
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgDataUri = `data:image/svg+xml;base64,${btoa(
        unescape(encodeURIComponent(svgData))
      )}`;

      // Create canvas and convert to PNG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const img = new Image();

      // Set crossOrigin to anonymous to avoid tainted canvas
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          // Set canvas size with scale factor for better quality
          const scale = 2;
          canvas.width = width * scale;
          canvas.height = height * scale;

          if (ctx) {
            // Scale the context and draw
            ctx.scale(scale, scale);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob and download
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${title}_${diagramType}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);

                  // Show success message
                  const originalError = error;
                  setError("✅ Diagram downloaded successfully!");
                  setTimeout(() => {
                    setError(originalError);
                  }, 3000);
                } else {
                  setError("Failed to create PNG blob");
                }
              },
              "image/png",
              1.0
            );
          }
        } catch (canvasError) {
          console.error("Canvas error:", canvasError);
          setError(
            "Failed to convert diagram to PNG. The diagram may contain elements that cannot be exported."
          );
        }
      };

      img.onerror = (imgError) => {
        console.error("Image load error:", imgError);
        setError(
          "Failed to load SVG for conversion. Trying alternative method..."
        );

        // Fallback: Just download the SVG file instead
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title}_${diagramType}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setError(
          "⚠️ Downloaded as SVG instead of PNG due to conversion issues."
        );
        setTimeout(() => {
          setError(null);
        }, 5000);
      };

      img.src = svgDataUri;
    } catch (e: unknown) {
      console.error("Error during PNG download:", e);
      let message = "Failed to download diagram. ";
      if (e instanceof Error) {
        message += `Error: ${e.message}`;
      } else {
        message += "An unexpected error occurred.";
      }
      setError(message);
    }
  };

  const loadFromHistory = (item: AnalysisResult) => {
    setAnalysis(item);
    setEditedDiagram(item.diagramCode);

    let normalizedDiagramType = item.diagramType;
    const currentValidIds = diagramTypes.map((dt) => dt.id);

    if (!currentValidIds.includes(item.diagramType)) {
      const legacyMapping: { [key: string]: string } = {
        entityRelationshipDiagram: "er_diagram",
        flowchart: "flowchart",
        classDiagram: "class_diagram",
        sequenceDiagram: "class_diagram",
        stateDiagram: "class_diagram",
        userJourney: "flowchart",
        gantt: "flowchart",
        pieChart: "flowchart",
        mindmaps: "flowchart",
      };
      if (legacyMapping[item.diagramType]) {
        normalizedDiagramType = legacyMapping[item.diagramType];
      } else {
        normalizedDiagramType = "flowchart";
      }
    }

    setDiagramType(normalizedDiagramType);
    setShowHistory(false);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">
          Please sign in to access the dashboard
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Diagram Generator
          </h1>
          <p className="text-gray-600">
            Transform your ideas into visual diagrams with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create Diagram</h2>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Diagram Type</label>
              <select
                value={diagramType}
                onChange={(e) => setDiagramType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                {diagramTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Describe what you want to visualize
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={5}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Example: Show the process of user registration with steps: visit site, fill form, submit, receive confirmation email"
              ></textarea>
            </div>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="enhancePrompt"
                checked={enhancePrompt}
                onChange={(e) => setEnhancePrompt(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="enhancePrompt" className="text-gray-700">
                Enhance my prompt with AI
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={generateDiagram}
                disabled={isLoading}
                className={`px-4 py-2 rounded font-medium ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? "Generating..." : "Generate Diagram"}
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium"
              >
                {showHistory ? "Hide History" : "Show History"}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Diagram Preview</h2>

            {error && (
              <div
                className={`mb-4 p-3 rounded ${
                  error.includes("✅")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            {analysis && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">Summary:</h3>
                <p className="text-gray-800">{analysis.summary}</p>
              </div>
            )}

            <div
              className="mb-4 border rounded-lg overflow-hidden"
              ref={mermaidRef}
            >
              {editedDiagram ? (
                <MermaidDiagram key={editedDiagram} chart={editedDiagram} />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100 text-gray-500">
                  Your diagram will appear here
                </div>
              )}
            </div>

            {editedDiagram && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">
                  Mermaid Code:
                </h3>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {editedDiagram}
                </pre>
              </div>
            )}

            {editedDiagram && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={downloadDiagram}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                >
                  Download as PNG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Diagrams</h2>
            {history.length === 0 ? (
              <p className="text-gray-600">No history yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => loadFromHistory(item)}
                  >
                    <h3 className="font-medium truncate">{item.summary}</h3>
                    <p className="text-sm text-gray-600">{item.diagramType}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
