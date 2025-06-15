import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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
        <Label htmlFor="diagram-type" className="block text-gray-700 mb-2">
          Diagram Type
        </Label>
        <Select value={diagramType} onValueChange={setDiagramType}>
          <SelectTrigger id="diagram-type" className="w-full">
            <SelectValue placeholder="Select a diagram type" />
          </SelectTrigger>
          <SelectContent>
            {diagramTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="description" className="block text-gray-700 mb-2">
          Describe what you want to visualize
        </Label>
        <Textarea
          id="description"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={5}
          placeholder="Example: Show the process of user registration with steps: visit site, fill form, submit, receive confirmation email"
        />
      </div>

      <div className="flex items-center mb-4">
        <Checkbox
          id="enhancePrompt"
          checked={enhancePrompt}
          onCheckedChange={(checked: boolean) => setEnhancePrompt(checked)}
          className="mr-2"
        />
        <Label htmlFor="enhancePrompt" className="text-gray-700">
          Enhance my prompt with AI
        </Label>
      </div>

      <div className="flex gap-2">
        <Button onClick={generateDiagram} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Diagram"}
        </Button>

        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide History" : "Show History"}
        </Button>
      </div>
    </div>
  );
}
