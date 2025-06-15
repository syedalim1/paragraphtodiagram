"use client";
import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import DiagramInputForm from "../../components/DiagramInputForm";
import DiagramOutputDisplay from "../../components/DiagramOutputDisplay";
import DiagramHistoryPanel from "../../components/DiagramHistoryPanel";

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
          <DiagramInputForm
            inputText={inputText}
            setInputText={setInputText}
            diagramType={diagramType}
            setDiagramType={setDiagramType}
            enhancePrompt={enhancePrompt}
            setEnhancePrompt={setEnhancePrompt}
            isLoading={isLoading}
            generateDiagram={generateDiagram}
            setShowHistory={setShowHistory}
            showHistory={showHistory}
            diagramTypes={diagramTypes}
          />

          {/* Output Section */}
          <DiagramOutputDisplay
            analysis={analysis}
            editedDiagram={editedDiagram}
            error={error}
            setError={setError}
            mermaidRef={mermaidRef}
            diagramType={diagramType}
          />
        </div>

        {/* History Panel */}
        <DiagramHistoryPanel
          history={history}
          showHistory={showHistory}
          loadFromHistory={loadFromHistory}
        />
      </div>
    </div>
  );
}
