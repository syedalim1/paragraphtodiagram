"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabaseClient"; // Adjusted import path
import Link from "next/link"; // Added for navigation

interface AnalysisData {
  // Added from dashboard for consistency
  summary: string;
  flowPoints?: string[];
  arrowMeanings?: Record<string, string>;
}

interface DiagramEntry {
  id: string;
  user_id: string;
  title?: string | null;
  description?: string | null;
  diagram_type: "uml" | "dfd" | "er";
  diagram_code: string;
  analysis?: AnalysisData | null; // Using defined interface
  created_at: string;
}

export default function HistoryPage() {
  const { user, isLoaded } = useUser();
  const [diagrams, setDiagrams] = useState<DiagramEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return; // Wait for Clerk user to be loaded

    if (!user) {
      setIsLoading(false);
      // Optionally, redirect to sign-in or show a message
      // For now, just don't fetch if no user
      return;
    }

    const fetchDiagrams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: supabaseError } = await supabase
          .from("diagrams")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (data) {
          setDiagrams(data as DiagramEntry[]);
        }
      } catch (err) {
        console.error("Error fetching diagrams:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to fetch diagrams.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagrams();
  }, [user, isLoaded]);

  if (isLoading && isLoaded) {
    // Show loading only if Clerk is loaded and we are fetching
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p>Loading history...</p>
      </div>
    );
  }

  if (!user && isLoaded) {
    // If Clerk is loaded but no user
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Generated Diagrams</h1>
        <p>
          Please{" "}
          <Link href="/sign-in" className="text-blue-600 hover:underline">
            sign in
          </Link>{" "}
          to view your diagram history.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6">Generated Diagrams</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        My Generated Diagrams
      </h1>

      {diagrams.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          You haven generated any diagrams yet.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {diagrams.map((diagram) => (
          <div
            key={diagram.id}
            className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg mb-1 text-blue-600">
              {diagram.title || `${diagram.diagram_type.toUpperCase()} Diagram`}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Generated on: {new Date(diagram.created_at).toLocaleString()}
            </p>
            {diagram.description && (
              <p className="text-sm text-gray-700 mb-2 italic">
                {diagram.description}
              </p>
            )}
            <details className="mb-2">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                View Mermaid Code
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {diagram.diagram_code}
              </pre>
            </details>
            {/* Optional: Render the diagram directly here if desired */}
            {/* <div className="border p-2 rounded-md bg-white mt-2">
              <Mermaid chart={diagram.diagram_code} />
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
