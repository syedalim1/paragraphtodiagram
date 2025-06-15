"use client";
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  chart: string;
  id?: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, id = 'mermaid-diagram' }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMermaid = async () => {
      try {
        // Initialize mermaid with configuration
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Arial, sans-serif',
          fontSize: 16,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          er: {
            useMaxWidth: true,
            fontSize: 16
          }
        });
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Mermaid:', err);
      }
    };

    initializeMermaid();
  }, []);

  useEffect(() => {
    if (!isInitialized || !chart || !elementRef.current) return;

    const renderDiagram = async () => {
      try {
        // Clear previous content
        if (elementRef.current) {
          elementRef.current.innerHTML = '';
        }

        // Validate chart syntax
        if (!chart.trim()) {
          throw new Error('Chart definition is empty');
        }

        // Generate unique ID for this render
        const diagramId = `${id}-${Date.now()}`;
        
        // Parse and render the diagram
        const { svg } = await mermaid.render(diagramId, chart);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg;
          
          // Find the SVG element and ensure it has proper attributes for download
          const svgElement = elementRef.current.querySelector('svg');
          if (svgElement) {
            // Set viewBox if not present
            if (!svgElement.getAttribute('viewBox')) {
              const bbox = svgElement.getBBox();
              svgElement.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
            }
            
            // Ensure proper namespace
            svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            
            // Add styles inline for better PNG export
            const styleElement = svgElement.querySelector('style');
            if (styleElement) {
              // Clean up any problematic styles that might cause download issues
              let styles = styleElement.textContent || '';
              
              // Remove any external font imports that might cause issues
              styles = styles.replace(/@import[^;]+;/g, '');
              
              // Ensure text is visible
              styles += `
                text { 
                  font-family: Arial, sans-serif !important; 
                  fill: #000 !important; 
                }
                .node text { 
                  fill: #000 !important; 
                }
                .edgeLabel text { 
                  fill: #000 !important; 
                }
              `;
              
              styleElement.textContent = styles;
            }
          }
        }
      } catch (err) {
        console.error('Error rendering Mermaid diagram:', err);
        
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444; border: 2px dashed #ef4444; border-radius: 8px; background: #fef2f2;">
              <p><strong>Diagram Rendering Error:</strong></p>
              <p>${err instanceof Error ? err.message : 'Unknown error occurred'}</p>
              <p style="font-size: 12px; margin-top: 10px;">Please check your diagram syntax and try again.</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [chart, isInitialized, id]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Initializing diagram renderer...</div>
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      className="mermaid-container w-full h-full flex items-center justify-center"
      style={{ minHeight: '200px' }}
    />
  );
};

export default MermaidDiagram;
