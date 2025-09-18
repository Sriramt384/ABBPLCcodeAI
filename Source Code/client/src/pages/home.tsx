import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  File, 
  FolderOpen, 
  Save, 
  Undo, 
  Redo, 
  Play 
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function Home() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'ladder' | 'io' | 'docs'>('code');
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const { toast } = useToast();

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setCurrentProject(newProject);
      toast({
        title: "Project Created",
        description: `Successfully created project: ${newProject.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create project: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setCurrentProject(updatedProject);
      toast({
        title: "Project Saved",
        description: "Project has been saved successfully",
      });
    },
  });

  const handleNewProject = useCallback(() => {
    const name = prompt("Enter project name:");
    if (name) {
      createProjectMutation.mutate({ name });
    }
  }, [createProjectMutation]);

  const handleSaveProject = useCallback(() => {
    if (currentProject) {
      updateProjectMutation.mutate({
        id: currentProject.id,
        data: currentProject,
      });
    }
  }, [currentProject, updateProjectMutation]);

  const handleRunSimulation = useCallback(() => {
    setIsSimulationRunning(!isSimulationRunning);
    toast({
      title: isSimulationRunning ? "Simulation Stopped" : "Simulation Started",
      description: isSimulationRunning 
        ? "PLC simulation has been stopped"
        : "PLC simulation is now running",
    });
  }, [isSimulationRunning, toast]);

  const handleCodeChange = useCallback((newCode: string) => {
    if (currentProject) {
      setCurrentProject(prev => prev ? { ...prev, code: newCode } : null);
    }
  }, [currentProject]);

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar 
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
        onCodeChange={handleCodeChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}



        {/* Editor Area */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1">

          </div>


        </div>
      </div>
    </div>
  );
}
