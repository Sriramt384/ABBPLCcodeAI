import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, PlayCircle, ArrowLeftRight } from "lucide-react";
import CodeGeneratorPanel from "./code-generator-panel";
import SimulationPanel from "./simulation-panel";
import ReverseEngineeringPanel from "./reverse-engineering-panel";
import type { Project } from "@shared/schema";
import TopBar from "./Topbar";

interface MainContentProps {
  currentProject: Project | null;
  onCodeChange: (code: string) => void;
}

interface MainTab {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  component: React.ComponentType<any>;
}

const mainTabs: MainTab[] = [
  { id: "code-generator", label: "Code Generator", icon: Code, color: "text-abb-blue", component: CodeGeneratorPanel },
  { id: "reverse-engineering", label: "Reverse Engineering", icon: ArrowLeftRight, color: "text-purple-500", component: ReverseEngineeringPanel },
  { id: "simulation", label: "Simulation", icon: PlayCircle, color: "text-orange-500", component: SimulationPanel },
];

export default function MainContent({ currentProject, onCodeChange }: MainContentProps) {
  const [activeTabId, setActiveTabId] = useState<string>("code-generator");

  const renderActivePanel = () => {
    const activeTab = mainTabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return null;
    const PanelComponent = activeTab.component;
    
    // Props are passed conditionally to ensure each panel gets what it needs
    const props = {
      currentProject,
      onCodeChange: onCodeChange,
    };
    
    // Special props for ReverseEngineeringPanel
    if (activeTab.id === 'reverse-engineering') {
      return <PanelComponent {...props} onReasonFound={onCodeChange} />;
    }
    
    return <PanelComponent {...props} />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-950 text-neutral-300">
      {/* Tab Navigation */}
      <TopBar/>
      <div className="flex-none p-4 border-b border-neutral-800 flex items-center gap-4">
        {mainTabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            onClick={() => setActiveTabId(tab.id)}
            className={`
              px-6 py-3 rounded-xl transition-all duration-200 ease-in-out
              ${activeTabId === tab.id
                ? "bg-neutral-800 text-neutral-50 shadow-lg"
                : "hover:bg-neutral-800/50 text-neutral-300"}
            `}
          >
            <div className="flex items-center gap-3">
              <tab.icon className={`w-6 h-6 ${tab.color}`} />
              <span className="font-semibold text-base">{tab.label}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Card className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 shadow-inner min-h-full">
          {renderActivePanel()}
        </Card>
      </div>
    </div>
  );
}