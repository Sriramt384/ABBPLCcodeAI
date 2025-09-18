import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Template, Project } from "@shared/schema";

interface TemplatesPanelProps {
  currentProject: Project | null;
  onCodeChange: (code: string) => void;
}

const categories = [
  { id: 'all', label: 'All Templates' },
  { id: 'motor_control', label: 'Motor Control' },
  { id: 'valve_control', label: 'Valve Control' },
  { id: 'conveyor', label: 'Conveyor Systems' },
  { id: 'interlock', label: 'Safety Interlocks' },
];

export default function TemplatesPanel({ currentProject, onCodeChange }: TemplatesPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  // Fetch templates
  const { data: allTemplates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const filteredTemplates = allTemplates.filter((template: Template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApplyTemplate = (template: Template) => {
    onCodeChange(template.code);
    toast({
      title: "Template Applied",
      description: `Successfully applied template: ${template.name}`,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      motor_control: "bg-blue-500",
      valve_control: "bg-green-500",
      conveyor: "bg-orange-500",
      interlock: "bg-red-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates..."
          className="pl-10 bg-surface-dark border border-border-dark focus:border-abb-blue"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-2 gap-1 bg-surface-dark p-1">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="motor_control" className="text-xs">Motors</TabsTrigger>
        </TabsList>
        <TabsList className="grid grid-cols-2 gap-1 bg-surface-dark p-1 mt-1">
          <TabsTrigger value="valve_control" className="text-xs">Valves</TabsTrigger>
          <TabsTrigger value="conveyor" className="text-xs">Conveyor</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Templates List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-abb-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No templates found</p>
              <p className="text-xs mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            filteredTemplates.map((template: Template) => (
              <Card key={template.id} className="bg-surface-dark border border-border-dark">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge 
                      className={`${getCategoryColor(template.category)} text-white text-xs ml-2`}
                    >
                      {template.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400">
                      {template.language === 'structured_text' ? 'ST' : 'LD'} • {template.variables.length} variables
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                        className="h-8 px-2 text-xs hover:bg-gray-700"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create Custom Template */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center">
            <Plus className="w-4 h-4 mr-2 text-abb-blue" />
            Create Custom Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-3">
            Save your current code as a reusable template
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-border-dark hover:bg-surface-dark"
            disabled={!currentProject?.code}
          >
            Save Current Code as Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
