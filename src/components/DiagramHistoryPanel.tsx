import React from "react";

interface AnalysisResult {
  summary: string;
  diagramType: string;
  diagramCode: string;
}

interface DiagramHistoryPanelProps {
  history: AnalysisResult[];
  showHistory: boolean;
  loadFromHistory: (item: AnalysisResult) => void;
}

export default function DiagramHistoryPanel({
  history,
  showHistory,
  loadFromHistory,
}: DiagramHistoryPanelProps) {
  if (!showHistory) {
    return null;
  }

  return (
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
  );
}
