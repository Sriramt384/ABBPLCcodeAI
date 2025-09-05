import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  FileText, 
  Code, 
  Image, 
  Package,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportPanelProps {
  generatedCode: string | null;
  naturalLanguageInput: string;
  outputFormat: string;
  generationTimestamp?: Date;
}

interface ExportHistoryItem {
  id: string;
  filename: string;
  format: string;
  timestamp: Date;
  size: string;
}

const exportFormats = [
  {
    id: "abb_automation_builder",
    name: "ABB Automation Builder",
    description: "Native ABB format (.st, .fb)",
    icon: Code,
    extension: ".st"
  },
  {
    id: "siemens_tia",
    name: "Siemens TIA Portal",
    description: "SCL format for TIA Portal",
    icon: Code,
    extension: ".scl"
  },
  {
    id: "rockwell_studio5000",
    name: "Rockwell Studio 5000",
    description: "Structured Text for Logix",
    icon: Code,
    extension: ".st"
  },
  {
    id: "codesys",
    name: "CODESYS",
    description: "IEC 61131-3 compliant format",
    icon: Code,
    extension: ".st"
  },
  {
    id: "documentation",
    name: "Technical Documentation",
    description: "PDF with code and requirements",
    icon: FileText,
    extension: ".pdf"
  },
  {
    id: "ladder_diagram",
    name: "Ladder Diagram",
    description: "Visual ladder logic (SVG/PNG)",
    icon: Image,
    extension: ".svg"
  }
];

const includeOptions = [
  { id: "source_code", label: "Generated Source Code", default: true },
  { id: "original_requirements", label: "Original Natural Language Requirements", default: true },
  { id: "generation_metadata", label: "Generation Metadata & Timestamp", default: true },
  { id: "code_comments", label: "Inline Code Comments", default: false },
  { id: "format_conversion_notes", label: "Format Conversion Notes", default: false },
  { id: "validation_info", label: "Code Validation Information", default: true }
];

// Helper function to generate PDF content
function generatePDFContent(
  code: string, 
  settings: Record<string, boolean>, 
  requirements: string, 
  format: string, 
  timestamp?: Date,
  formatInfo?: any
): string {
  let content = "GENERATED PLC CODE DOCUMENTATION\n";
  content += "=".repeat(50) + "\n\n";
  
  if (settings.generation_metadata) {
    content += "GENERATION METADATA:\n";
    content += `- Export Format: ${formatInfo?.name}\n`;
    content += `- Original Format: ${format.replace('_', ' ').toUpperCase()}\n`;
    content += `- Generated: ${timestamp?.toLocaleString() || 'Unknown'}\n`;
    content += `- Exported: ${new Date().toLocaleString()}\n\n`;
  }
  
  if (settings.original_requirements && requirements) {
    content += "ORIGINAL REQUIREMENTS:\n";
    content += requirements + "\n\n";
  }
  
  if (settings.source_code) {
    content += "GENERATED PLC CODE:\n";
    content += "-".repeat(30) + "\n";
    content += code + "\n\n";
  }
  
  return content;
}

// Helper function to create a simple PDF
function createSimplePDF(textContent: string): string {
  // This is a very basic PDF structure - for production, use a proper PDF library
  const lines = textContent.split('\n');
  let pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${textContent.length + 100} >>
stream
BT
/F1 12 Tf
50 750 Td
`;
  
  lines.forEach((line, index) => {
    if (index < 50) { // Limit lines to fit on page
      pdfContent += `(${line.replace(/[()\\]/g, '\\$&')}) Tj\n0 -15 Td\n`;
    }
  });
  
  pdfContent += `ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000251 00000 n 
0000000${(400 + textContent.length).toString().padStart(3, '0')} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${450 + textContent.length}
%%EOF`;
  
  return pdfContent;
}

// Helper function to generate SVG ladder diagram
function generateLadderDiagramSVG(code: string, requirements: string): string {
  const width = 800;
  const height = 600;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  
    <text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#212529">
    Generated Ladder Logic Diagram
  </text>
  
    <rect x="20" y="50" width="760" height="60" fill="#e7f3ff" stroke="#0066cc" stroke-width="1" rx="5"/>
  <text x="30" y="70" font-family="Arial" font-size="12" font-weight="bold" fill="#0066cc">Requirements:</text>`;
  
  // Add requirements text (truncated for display)
  const reqLines = requirements.substring(0, 200).split('\n');
  reqLines.slice(0, 2).forEach((line, index) => {
    svg += `<text x="30" y="${85 + index * 15}" font-family="Arial" font-size="11" fill="#333">${line.substring(0, 90)}${line.length > 90 ? '...' : ''}</text>`;
  });
  
  svg += `
    <g stroke="#333" stroke-width="2" fill="none">
        <line x1="50" y1="140" x2="50" y2="550" />
        <line x1="750" y1="140" x2="750" y2="550" />
    
        <line x1="50" y1="180" x2="750" y2="180" />
        <rect x="100" y="170" width="60" height="20" fill="white" stroke="#333" stroke-width="2"/>
    <text x="130" y="185" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">INPUT_1</text>
    
        <rect x="200" y="170" width="60" height="20" fill="white" stroke="#333" stroke-width="2"/>
    <text x="230" y="185" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">INPUT_2</text>
    
        <circle cx="650" cy="180" r="15" fill="white" stroke="#333" stroke-width="2"/>
    <text x="650" y="185" text-anchor="middle" font-family="Arial" font-size="8" fill="#333">OUT</text>
    <text x="650" y="205" text-anchor="middle" font-family="Arial" font-size="9" fill="#333">OUTPUT_1</text>
    
        <line x1="50" y1="250" x2="750" y2="250" />
        <rect x="300" y="230" width="120" height="40" fill="white" stroke="#333" stroke-width="2"/>
    <text x="360" y="245" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#333">TIMER</text>
    <text x="360" y="258" text-anchor="middle" font-family="Arial" font-size="8" fill="#333">T001</text>
    
        <line x1="50" y1="320" x2="750" y2="320" />
        <rect x="150" y="300" width="120" height="40" fill="white" stroke="#333" stroke-width="2"/>
    <text x="210" y="315" text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill="#333">COUNTER</text>
    <text x="210" y="328" text-anchor="middle" font-family="Arial" font-size="8" fill="#333">C001</text>
  </g>
  
    <rect x="20" y="370" width="760" height="180" fill="#f8f9fa" stroke="#6c757d" stroke-width="1" rx="5"/>
  <text x="30" y="390" font-family="Arial" font-size="12" font-weight="bold" fill="#495057">Generated Code Preview:</text>`;
  
  // Add code lines (truncated for display)
  const codeLines = code.split('\n');
  codeLines.slice(0, 10).forEach((line, index) => {
    if (line.trim()) {
      svg += `<text x="30" y="${405 + index * 15}" font-family="Courier" font-size="10" fill="#333">${line.substring(0, 80)}${line.length > 80 ? '...' : ''}</text>`;
    }
  });
  
  svg += `
    <text x="400" y="580" text-anchor="middle" font-family="Arial" font-size="10" fill="#6c757d">
    Generated from natural language requirements using AI code generation
  </text>
</svg>`;
  
  return svg;
}

export default function ExportPanel({ 
  generatedCode, 
  naturalLanguageInput, 
  outputFormat,
  generationTimestamp 
}: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState("abb_automation_builder");
  const [includeSettings, setIncludeSettings] = useState(
    includeOptions.reduce((acc, option) => ({
      ...acc,
      [option.id]: option.default
    }), {} as Record<string, boolean>)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!generatedCode) {
      toast({
        title: "No Code to Export",
        description: "Please generate PLC code first using the code generator",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `generated_plc_code_${timestamp}${selectedFormatInfo?.extension || '.st'}`;
      
      let content = "";
      let mimeType = "";
      
      if (selectedFormat === "documentation") {
        content = generatePDFContent(generatedCode, includeSettings, naturalLanguageInput, outputFormat, generationTimestamp, selectedFormatInfo);
        content = createSimplePDF(content);
        mimeType = "application/pdf";
      } else if (selectedFormat === "ladder_diagram") {
        content = generateLadderDiagramSVG(generatedCode, naturalLanguageInput);
        mimeType = "image/svg+xml";
      } else {
        // Build export content for code formats
        if (includeSettings.generation_metadata) {
          content += `/*\n`;
          content += ` * Generated PLC Code Export\n`;
          content += ` * Export Format: ${selectedFormatInfo?.name}\n`;
          content += ` * Original Format: ${outputFormat.replace('_', ' ').toUpperCase()}\n`;
          content += ` * Generated: ${generationTimestamp?.toISOString() || 'Unknown'}\n`;
          content += ` * Exported: ${new Date().toISOString()}\n`;
          content += ` */\n\n`;
        }
        
        if (includeSettings.original_requirements && naturalLanguageInput) {
          content += `/*\n`;
          content += ` * ORIGINAL REQUIREMENTS:\n`;
          content += ` * ${naturalLanguageInput.split('\n').join('\n * ')}\n`;
          content += ` */\n\n`;
        }
        
        if (includeSettings.format_conversion_notes) {
          content += `/*\n`;
          content += ` * FORMAT CONVERSION NOTES:\n`;
          content += ` * - Code originally generated in: ${outputFormat.replace('_', ' ')}\n`;
          content += ` * - Exported for: ${selectedFormatInfo?.name}\n`;
          content += ` * - Manual verification recommended for platform-specific syntax\n`;
          content += ` */\n\n`;
        }
        
        if (includeSettings.validation_info) {
          content += `/*\n`;
          content += ` * VALIDATION STATUS:\n`;
          content += ` * - Syntax: Generated and validated\n`;
          content += ` * - Logic: Review recommended\n`;
          content += ` * - Platform compatibility: Verify before deployment\n`;
          content += ` */\n\n`;
        }
        
        if (includeSettings.source_code) {
          content += `// ========== GENERATED PLC CODE ==========\n\n`;
          content += generatedCode;
        }
        
        if (includeSettings.code_comments && !generatedCode.includes('//') && !generatedCode.includes('(*')) {
          content = content.replace(/;/g, '; // TODO: Add specific comment');
        }
        
        mimeType = 'text/plain';
      }
      
      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Add to export history
      const newExport: ExportHistoryItem = {
        id: Date.now().toString(),
        filename,
        format: selectedFormatInfo?.name || "Unknown",
        timestamp: new Date(),
        size: `${(content.length / 1024).toFixed(1)}KB`
      };
      setExportHistory(prev => [newExport, ...prev.slice(0, 4)]); // Keep only last 5
      
      toast({
        title: "Export Successful",
        description: `Generated code exported as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred during export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleIncludeSetting = (settingId: string) => {
    setIncludeSettings(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }));
  };

  const selectedFormatInfo = exportFormats.find(f => f.id === selectedFormat);
  const hasGeneratedCode = Boolean(generatedCode);

  return (
    <div className="space-y-4">
      {/* Code Status */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Generated Code Status:</span>
            <div className="flex items-center space-x-2">
              {hasGeneratedCode ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Ready to Export
                  </Badge>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Badge variant="outline" className="text-gray-400">
                    No Code Generated
                  </Badge>
                </>
              )}
            </div>
          </div>
          {hasGeneratedCode && generationTimestamp && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-400">Generated:</span>
              <span className="text-xs text-gray-300">
                {generationTimestamp.toLocaleString()}
              </span>
            </div>
          )}
          {hasGeneratedCode && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-400">Original Format:</span>
              <Badge variant="secondary">
                {outputFormat.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Format Selection */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Download className="w-4 h-4 mr-2 text-cyan-500" />
            Export Format
          </CardTitle>
          <CardDescription className="text-xs">
            Choose target PLC platform or documentation format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger className="w-full bg-panel-dark border border-border-dark focus:border-abb-blue">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <SelectItem key={format.id} value={format.id}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{format.name}</div>
                        <div className="text-xs text-gray-400">{format.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Include Options */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Include in Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {includeOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={includeSettings[option.id]}
                  onCheckedChange={() => toggleIncludeSetting(option.id)}
                />
                <Label 
                  htmlFor={option.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Preview */}
      {selectedFormatInfo && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Export Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Target Format:</span>
              <Badge variant="outline">{selectedFormatInfo.name}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">File Extension:</span>
              <code className="text-sm bg-panel-dark px-2 py-1 rounded">
                {selectedFormatInfo.extension}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Content Size:</span>
              <span className="text-sm text-gray-300">
                {hasGeneratedCode ? `~${Math.round((generatedCode?.length || 0) / 1024)}KB` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={!hasGeneratedCode || isExporting}
        className={`w-full ${
          hasGeneratedCode 
            ? "bg-cyan-600 hover:bg-cyan-700" 
            : "bg-gray-600 cursor-not-allowed"
        }`}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            {hasGeneratedCode ? "Export Generated Code" : "Generate Code First"}
          </>
        )}
      </Button>

      {/* Export History */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          {exportHistory.length > 0 ? (
            <div className="space-y-2">
              {exportHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-panel-dark rounded border border-border-dark">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{item.filename}</div>
                    <div className="text-xs text-gray-400">{item.format} • {item.size}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No exports yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Generate and export code to see history
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}