import React from "react";
import Prism from "prismjs";
import "prismjs/components/prism-javascript"; // Import the language you need
import "./terminal.css"; // Custom green-on-black theme


const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl shadow-2xl ${className}`}>{children}</div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-xl font-bold ${className}`}>{children}</h2>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 pt-0 ${className}`}>{children}</div>
);

interface GeneratedCodeDisplayProps {
  code: string;
  language?: string; // default to JavaScript
}

export default function GeneratedCodeDisplay({ code, language = "javascript" }: GeneratedCodeDisplayProps) {
  const [displayedCode, setDisplayedCode] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(true);
  const codeRef = React.useRef<HTMLPreElement>(null);

  React.useEffect(() => {
    if (!code) return;

    let charIndex = 0;
    setDisplayedCode("");
    setIsTyping(true);

    const interval = setInterval(() => {
      if (charIndex < code.length) {
        setDisplayedCode(prev => prev + code[charIndex]);
        charIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 10); // Typing speed in ms

    return () => clearInterval(interval);
  }, [code]);

  // Highlight whenever displayedCode updates
  React.useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [displayedCode]);

  return (
    <Card className="bg-surface-dark border border-border-dark mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Generated Code</CardTitle>
      </CardHeader>
      <CardContent>
        <pre
          ref={codeRef}
          className={`language-${language} rounded overflow-x-scroll p-4 font-mono text-xs whitespace-pre-wrap`}
          style={{ maxHeight: "400px" }}
        >
          {displayedCode}
        </pre>
        {isTyping && <p className="text-gray-400 text-xs mt-1">Typing...</p>}
      </CardContent>
    </Card>
  );
}