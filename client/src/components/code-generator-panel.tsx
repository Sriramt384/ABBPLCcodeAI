import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GeneratedCodeDisplay from "./GeneratedCodeDisplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";
import ExportPanel from "./export-panel";
import ValidationPanel from "./validation-panel";

interface CodeGeneratorPanelProps {
  currentProject: Project | null;
  onCodeGenerated: (code: string) => void;
}

export default function CodeGeneratorPanel({ currentProject, onCodeGenerated }: CodeGeneratorPanelProps) {
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [outputFormat, setOutputFormat] = useState("structured_text");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const generateCodeMutation = useMutation({
    mutationFn: async (data: { naturalLanguageInput: string; outputLanguage: string; projectId?: string }) => {
      // Simulate progress
      const progressSteps = [
        { progress: 25, status: "Parsing natural language input..." },
        { progress: 50, status: "Analyzing control logic requirements..." },
        { progress: 75, status: "Generating IEC 61131-3 code..." },
        { progress: 100, status: "Validating syntax..." },
      ];

      for (const step of progressSteps) {
        setGenerationProgress(step.progress);
        setGenerationStatus(step.status);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Fetch code from local Ollama
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "my_model",
          prompt: `${data.naturalLanguageInput}\n\nGenerate code in ${data.outputLanguage} format and dont use any comments in the output just generate bare code.`,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to connect to Ollama");

      const result = await response.json();
      return { code: result.response };
    },

    onSuccess: async (result) => {
      setGeneratedCode(result.code);
      onCodeGenerated(result.code);

      try {
        await fetch("/api/save-sampleoutput", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: result.code }),
        });
      } catch (err) {
        console.error("Failed to save file:", err);
      }

      setGenerationProgress(0);
      setGenerationStatus("");
      toast({
        title: "Code Generated",
        description: "Displayed in the Output Panel.",
      });
    },

    onError: (error: any) => {
      setGenerationProgress(0);
      setGenerationStatus("");
    },
  });

  const handleGenerateCode = () => {
    if (!naturalLanguageInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a natural language description of your control logic.",
        variant: "destructive",
      });
      return;
    }

    generateCodeMutation.mutate({
      naturalLanguageInput,
      outputLanguage: outputFormat,
      projectId: currentProject?.id,
    });
  };

  return (
    <div className="space-y-4">
      {/* Natural Language Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Natural Language Input</label>
        <Textarea
          value={naturalLanguageInput}
          onChange={(e) => setNaturalLanguageInput(e.target.value)}
          className="w-full h-24 bg-surface-dark border border-border-dark resize-none focus:border-abb-blue"
          placeholder="Describe your control logic... e.g., 'When tank level exceeds 90%, close valve A and activate alarm'"
        />
      </div>

      {/* Output Format Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Output Format</label>
        <Select value={outputFormat} onValueChange={setOutputFormat}>
          <SelectTrigger className="w-full bg-surface-dark border border-border-dark focus:border-abb-blue">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="structured_text">Structured Text (ST)</SelectItem>
            <SelectItem value="ladder_logic">Ladder Logic (LD)</SelectItem>
            <SelectItem value="function_block">Function Block (FB)</SelectItem>
            <SelectItem value="sequential_function_chart">Sequential Function Chart (SFC)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateCode}
        disabled={!naturalLanguageInput.trim() || generateCodeMutation.isPending}
        className="w-full bg-abb-blue hover:bg-blue-700 text-white font-medium"
      >
        {generateCodeMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Code
          </>
        )}
      </Button>

      {/* Progress + Status */}
      {generateCodeMutation.isPending && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Sparkles className="w-4 h-4 text-abb-blue mr-2" />
              AI Code Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={generationProgress} className="w-full" />
            <p className="text-xs text-gray-300">{generationStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {generatedCode && !generateCodeMutation.isPending && (
        <>
          <Card className="bg-surface-dark border border-border-dark">
            <CardContent className="pt-4">
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Generation Successful
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Code is now available in your editor.
              </p>
            </CardContent>
          </Card>
          <GeneratedCodeDisplay code={generatedCode} />
          <ValidationPanel
  generatedCode={generatedCode}
  outputFormat={outputFormat}
  naturalLanguageInput={naturalLanguageInput}
  generationTimestamp={new Date()}
/>
          {/* Display Generated Code */}
          <ExportPanel
            generatedCode={generatedCode} // This should be the actual code string
            naturalLanguageInput={naturalLanguageInput}
            outputFormat={outputFormat}
            generationTimestamp={new Date()}
          />

        </>

      )}


    </div>
  );
}
