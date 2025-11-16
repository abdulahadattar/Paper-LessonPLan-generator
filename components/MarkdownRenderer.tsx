import React, { useEffect, useRef } from 'react';

// Make renderMathInElement available on the window object for TypeScript
declare global {
  interface Window {
    renderMathInElement?: (element: HTMLElement, options?: any) => void;
  }
}

interface MarkdownRendererProps {
  text: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, className }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger KaTeX rendering when the component mounts or the text changes
    if (rootRef.current && window.renderMathInElement) {
      window.renderMathInElement(rootRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false, // Don't crash if there's a LaTeX syntax error
      });
    }
  }, [text]);

  // This regex is the same one used in the export service to ensure consistency
  const regex = /(\$\$[\s\S]*?\$\$|\$[^\s](?:[^\$]*[^\s])?\$|\*\*.*?\*\*|\*.*?\*)/g;
  
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    // Find all markdown-like tokens and process the string piece by piece
    while ((match = regex.exec(text)) !== null) {
      // Add the plain text before the matched token
      if (match.index > lastIndex) {
        parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      const matchedText = match[0];

      // Handle math blocks - just output the text with delimiters for KaTeX to find
      if ((matchedText.startsWith('$') && matchedText.endsWith('$')) || (matchedText.startsWith('$$') && matchedText.endsWith('$$'))) {
        parts.push(<span key={key++}>{matchedText}</span>);
      } 
      // Handle bold
      else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        parts.push(<strong key={key++}>{matchedText.slice(2, -2)}</strong>);
      } 
      // Handle italics
      else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        parts.push(<em key={key++}>{matchedText.slice(1, -1)}</em>);
      }
      
      lastIndex = match.index + matchedText.length;
    }

    // Add any remaining plain text after the last token
    if (lastIndex < text.length) {
      parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
    }
    
    return parts;
  };

  return (
    <div ref={rootRef} className={className}>
      {renderContent()}
    </div>
  );
};

export default MarkdownRenderer;
