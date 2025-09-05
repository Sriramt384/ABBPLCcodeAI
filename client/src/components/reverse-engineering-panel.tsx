import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GeneratedCodeDisplay from "./GeneratedCodeDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@shared/schema";

interface ReverseEngineeringPanelProps {
  currentProject: Project | null;
  onReasonFound: (reason: string) => void;
}

export default function ReverseEngineeringPanel({ currentProject, onReasonFound }: ReverseEngineeringPanelProps) {
  const [stCodeInput, setStCodeInput] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");
  const [reason, setReason] = useState<string | null>(null);
  const { toast } = useToast();

  const reverseEngineerMutation = useMutation({
    mutationFn: async (data: { stCode: string; projectId?: string }) => {
      // Simulated progress
      const progressSteps = [
        { progress: 25, status: "Parsing ST code..." },
        { progress: 50, status: "Analyzing control logic..." },
        { progress: 75, status: "Determining reasoning behind code..." },
        { progress: 100, status: "Finalizing reason output..." },
      ];

      for (const step of progressSteps) {
        setGenerationProgress(step.progress);
        setGenerationStatus(step.status);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      // Call Ollama API (same as CodeGeneratorPanel)
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "my_model",
          prompt: `Analyze the following IEC 61131-3 Structured Text (ST) code and explain the reasoning behind it:\n\n${data.stCode} keep the reason concise`,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error("Failed to connect to Ollama");

      const result = await response.json();
      return { reason: result.response };
    },

    onSuccess: async (result) => {
      setReason(result.reason);
      onReasonFound(result.reason);

      // Optionally save the result like in CodeGeneratorPanel
      try {
        await fetch("/api/save-sampleoutput", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: result.reason }),
        });
      } catch (err) {
        console.error("Failed to save reason:", err);
      }

      setGenerationProgress(0);
      setGenerationStatus("");
      toast({
        title: "Analysis Complete",
        description: "Reason behind ST code has been determined.",
      });
    },

    onError: (error: any) => {
      setGenerationProgress(0);
      setGenerationStatus("");
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeCode = () => {
    if (!stCodeInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter ST code to analyze.",
        variant: "destructive",
      });
      return;
    }

    reverseEngineerMutation.mutate({
      stCode: stCodeInput,
      projectId: currentProject?.id,
    });
  };

  return (
    <div className="space-y-4">
      {/* ST Code Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Structured Text (ST) Code</label>
        <Textarea
          value={stCodeInput}
          onChange={(e) => setStCodeInput(e.target.value)}
          className="w-full h-24 bg-surface-dark border border-border-dark resize-none focus:border-abb-blue font-mono text-sm"
          placeholder="Paste your ST code here..."
        />
      </div>

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyzeCode}
        disabled={!stCodeInput.trim() || reverseEngineerMutation.isPending}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium"
      >
        {reverseEngineerMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Find Reason
          </>
        )}
      </Button>

      {/* Progress + Status */}
      {reverseEngineerMutation.isPending && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Sparkles className="w-4 h-4 text-purple-500 mr-2" />
              Analyzing ST Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={generationProgress} className="w-full" />
            <p className="text-xs text-gray-300">{generationStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {reason && !reverseEngineerMutation.isPending && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardContent className="pt-4">
            <div className="flex items-center text-green-400 text-sm mb-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Analysis Successful
            </div>
            <GeneratedCodeDisplay code={reason} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {reverseEngineerMutation.isError && !reverseEngineerMutation.isPending && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardContent className="pt-4">
            <div className="flex items-center text-red-400 text-sm">
              <XCircle className="w-4 h-4 mr-2" />
              Analysis Failed
            </div>
            <p className="text-xs text-gray-300 mt-1">
              {reverseEngineerMutation.error?.message || "An error occurred during analysis."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
