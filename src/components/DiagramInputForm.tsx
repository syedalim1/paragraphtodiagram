import React from "react";

interface DiagramInputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  diagramType: string;
  setDiagramType: (type: string) => void;
  enhancePrompt: boolean;
  setEnhancePrompt: (enhance: boolean) => void;
  isLoading: boolean;
  generateDiagram: () => void;
  setShowHistory: (show: boolean) => void;
  showHistory: boolean;
  diagramTypes: { id: string; name: string }[];
}

export default function DiagramInputForm({
  inputText,
  setInputText,
  diagramType,
  setDiagramType,
  enhancePrompt,
  setEnhancePrompt,
  isLoading,
  generateDiagram,
  setShowHistory,
  showHistory,
  diagramTypes,
}: DiagramInputFormProps) {
  return (
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
  );
}
