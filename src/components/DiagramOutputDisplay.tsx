import React, { RefObject } from "react";
import MermaidDiagram from "./MermaidDiagram";

interface AnalysisResult {
  summary: string;
  diagramType: string;
  diagramCode: string;
}

interface DiagramOutputDisplayProps {
  analysis: AnalysisResult | null;
  editedDiagram: string;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  mermaidRef: RefObject<HTMLDivElement | null>;
  diagramType: string;
}

export default function DiagramOutputDisplay({
  analysis,
  editedDiagram,
  error,
  setError,
  mermaidRef,
  diagramType,
}: DiagramOutputDisplayProps) {
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
          const cleanedStyles = styleEl.textContent
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
  return (
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

      <div className="mb-4 border rounded-lg overflow-hidden" ref={mermaidRef}>
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
          <h3 className="font-medium text-gray-700 mb-2">Mermaid Code:</h3>
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
  );
}
