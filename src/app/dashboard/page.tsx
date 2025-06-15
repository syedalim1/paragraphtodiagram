"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import DiagramInputForm from "../../components/DiagramInputForm";
import DiagramOutputDisplay from "../../components/DiagramOutputDisplay";
import DiagramHistoryPanel from "../../components/DiagramHistoryPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {

  FaMoon,
  FaShareAlt,
  FaSun,
} from "react-icons/fa";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);

  const diagramTypes = [
    { id: "er_diagram", name: "ER Diagram" },
    { id: "flowchart", name: "DFD (Data Flow Diagram)" },
    { id: "class_diagram", name: "UML Diagram (Class)" },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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

  const handleClearAll = () => {
    setInputText("");
    setEditedDiagram("");
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    setDiagramType("flowchart");
    setEnhancePrompt(true);
    
    console.log("Cleared all data");
  };

 

  

  const loadFromHistory = (item: AnalysisResult) => {
    setInputText(item.summary); // Populate input with summary from history
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
              Diagram AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Transform ideas into visual diagrams with AI
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Input
              type="search"
              placeholder="Search diagrams..."
              className="w-full sm:w-48 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                // toast({
                //   title: "Share Feature",
                //   description: "This feature is coming soon!",
                // });
                console.log("Share feature clicked - coming soon");
              }}
              className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              <FaShareAlt />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Create Diagram
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <CardTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                Diagram Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <DiagramOutputDisplay
                analysis={analysis}
                editedDiagram={editedDiagram}
                error={error}
                setError={setError}
                mermaidRef={mermaidRef}
                diagramType={diagramType}
              />
             
            </CardContent>
          </Card>
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
