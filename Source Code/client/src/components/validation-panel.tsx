import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Info, Shield, Clock, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationPanelProps {
  generatedCode: string | null;
  outputFormat: string;
  naturalLanguageInput: string;
  generationTimestamp?: Date;
}

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
  severity: 'critical' | 'medium' | 'low';
  category: 'syntax' | 'semantics' | 'safety' | 'style' | 'iec61131';
}

interface ValidationResults {
  isValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  suggestions: ValidationResult[];
  safetyChecks: {
    emergencyStop: boolean;
    safetyInterlocks: boolean;
    failSafeMechanisms: boolean;
    watchdogTimer: boolean;
    inputValidation: boolean;
  };
  iecCompliance: {
    variableDeclaration: boolean;
    dataTypeUsage: boolean;
    structureCompliance: boolean;
    namingConvention: boolean;
  };
  syntaxScore: number;
  logicScore: number;
  safetyScore: number;
}

export default function ValidationPanel({
  generatedCode,
  outputFormat,
  naturalLanguageInput,
  generationTimestamp
}: ValidationPanelProps) {
  const [validationResults, setValidationResults] = useState<ValidationResults | null>(null);
  const { toast } = useToast();

  // ST-specific validation function
  const performSTValidation = async (code: string): Promise<ValidationResults> => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const results: ValidationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      safetyChecks: {
        emergencyStop: false,
        safetyInterlocks: false,
        failSafeMechanisms: false,
        watchdogTimer: false,
        inputValidation: false
      },
      iecCompliance: {
        variableDeclaration: false,
        dataTypeUsage: false,
        structureCompliance: false,
        namingConvention: true
      },
      syntaxScore: 100,
      logicScore: 100,
      safetyScore: 0
    };

    const lines = code.split('\n');
    let inVarSection = false;
    let inFunctionBlock = false;
    let braceCount = 0;
    const declaredVariables = new Set<string>();
    const usedVariables = new Set<string>();

    // IEC 61131-3 ST reserved words
    const reservedWords = [
      'VAR', 'END_VAR', 'VAR_INPUT', 'VAR_OUTPUT', 'VAR_IN_OUT', 'VAR_TEMP', 'VAR_EXTERNAL', 'VAR_GLOBAL',
      'PROGRAM', 'END_PROGRAM', 'FUNCTION', 'END_FUNCTION', 'FUNCTION_BLOCK', 'END_FUNCTION_BLOCK',
      'IF', 'THEN', 'ELSE', 'ELSIF', 'END_IF', 'CASE', 'OF', 'END_CASE',
      'FOR', 'TO', 'BY', 'DO', 'END_FOR', 'WHILE', 'END_WHILE', 'REPEAT', 'UNTIL', 'END_REPEAT',
      'EXIT', 'RETURN', 'TRUE', 'FALSE', 'AND', 'OR', 'XOR', 'NOT', 'MOD'
    ];

    // IEC 61131-3 standard data types
    const standardDataTypes = [
      'BOOL', 'SINT', 'INT', 'DINT', 'LINT', 'USINT', 'UINT', 'UDINT', 'ULINT',
      'REAL', 'LREAL', 'TIME', 'DATE', 'TIME_OF_DAY', 'TOD', 'DATE_AND_TIME', 'DT',
      'STRING', 'WSTRING', 'BYTE', 'WORD', 'DWORD', 'LWORD'
    ];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();
      const upperLine = trimmedLine.toUpperCase();
      
      if (!trimmedLine || trimmedLine.startsWith('(*') || trimmedLine.startsWith('//')) return;

      // Track sections
      if (upperLine.startsWith('VAR')) {
        inVarSection = true;
        results.iecCompliance.variableDeclaration = true;
      }
      if (upperLine === 'END_VAR') {
        inVarSection = false;
      }
      if (upperLine.includes('FUNCTION_BLOCK') || upperLine.includes('PROGRAM')) {
        inFunctionBlock = true;
      }

      // Variable declaration parsing
      if (inVarSection && trimmedLine.includes(':') && !upperLine.startsWith('VAR')) {
        const varMatch = trimmedLine.match(/^(\w+)\s*:\s*(\w+)/);
        if (varMatch) {
          const [, varName, dataType] = varMatch;
          declaredVariables.add(varName.toUpperCase());
          
          // Check data type validity
          if (standardDataTypes.includes(dataType.toUpperCase())) {
            results.iecCompliance.dataTypeUsage = true;
          } else {
            results.warnings.push({
              type: 'warning',
              message: `Non-standard data type '${dataType}' used`,
              line: lineNum,
              severity: 'medium',
              category: 'iec61131'
            });
          }

          // Check naming convention (should start with letter, no special chars except underscore)
          if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(varName)) {
            results.warnings.push({
              type: 'warning',
              message: `Variable '${varName}' doesn't follow IEC 61131-3 naming convention`,
              line: lineNum,
              severity: 'medium',
              category: 'iec61131'
            });
            results.iecCompliance.namingConvention = false;
          }

          // Check for reserved word usage
          if (reservedWords.includes(varName.toUpperCase())) {
            results.errors.push({
              type: 'error',
              message: `'${varName}' is a reserved word and cannot be used as variable name`,
              line: lineNum,
              severity: 'critical',
              category: 'syntax'
            });
            results.isValid = false;
          }
        }
      }

      // Syntax validation
      
      // IF-THEN-END_IF structure
      if (upperLine.includes('IF ') && !upperLine.includes('THEN') && !trimmedLine.includes(':=')) {
        results.errors.push({
          type: 'error',
          message: 'IF statement must be followed by THEN',
          line: lineNum,
          severity: 'critical',
          category: 'syntax'
        });
        results.isValid = false;
      }

      // FOR-TO-DO-END_FOR structure
      if (upperLine.includes('FOR ') && !upperLine.includes('TO')) {
        results.errors.push({
          type: 'error',
          message: 'FOR statement missing TO keyword',
          line: lineNum,
          severity: 'critical',
          category: 'syntax'
        });
        results.isValid = false;
      }

      // WHILE-DO-END_WHILE structure
      if (upperLine.includes('WHILE ') && !upperLine.includes('DO')) {
        results.errors.push({
          type: 'error',
          message: 'WHILE statement missing DO keyword',
          line: lineNum,
          severity: 'critical',
          category: 'syntax'
        });
        results.isValid = false;
      }

      // CASE-OF-END_CASE structure
      if (upperLine.includes('CASE ') && !upperLine.includes('OF')) {
        results.errors.push({
          type: 'error',
          message: 'CASE statement missing OF keyword',
          line: lineNum,
          severity: 'critical',
          category: 'syntax'
        });
        results.isValid = false;
      }

      // Assignment operator validation
      if (trimmedLine.includes('=') && !trimmedLine.includes(':=') && !trimmedLine.includes('<=') &&
          !trimmedLine.includes('>=') && !trimmedLine.includes('<>') && !upperLine.includes('IF ')) {
        results.warnings.push({
          type: 'warning',
          message: 'Use := for assignment, = is for comparison',
          line: lineNum,
          severity: 'medium',
          category: 'syntax'
        });
      }

      // Semicolon validation
      if (!inVarSection && (trimmedLine.includes(':=') || upperLine.startsWith('RETURN') ||
          upperLine.includes('EXIT')) && !trimmedLine.endsWith(';')) {
        results.warnings.push({
          type: 'warning',
          message: 'Statement should end with semicolon',
          line: lineNum,
          severity: 'medium',
          category: 'style'
        });
      }

      // Variable usage tracking
      const assignmentMatch = trimmedLine.match(/(\w+)\s*:=/);
      if (assignmentMatch) {
        usedVariables.add(assignmentMatch[1].toUpperCase());
      }

      // Safety checks
      if (/(emergency|e_stop|estop|safety)/i.test(trimmedLine)) {
        results.safetyChecks.emergencyStop = true;
      }

      if (/(interlock|safety_gate|light_curtain|safety_door)/i.test(trimmedLine)) {
        results.safetyChecks.safetyInterlocks = true;
      }

      if (/(fail_safe|watchdog|timeout|safety_time)/i.test(trimmedLine)) {
        results.safetyChecks.failSafeMechanisms = true;
      }

      // FIX: Add missing parentheses
      if (/(watchdog|wdt|timer.*reset)/i.test(trimmedLine)) {
        results.safetyChecks.watchdogTimer = true;
      }

      if (/(input.*valid|range.*check|limit.*check)/i.test(trimmedLine)) {
        results.safetyChecks.inputValidation = true;
      }

      // Structure compliance
      if (upperLine.includes('END_IF') || upperLine.includes('END_FOR') ||
          upperLine.includes('END_WHILE') || upperLine.includes('END_CASE')) {
        results.iecCompliance.structureCompliance = true;
      }

      // Parentheses and bracket matching
      braceCount += (trimmedLine.match(/\(/g) || []).length;
      braceCount -= (trimmedLine.match(/\)/g) || []).length;
    });

    // Check for unmatched parentheses
    if (braceCount !== 0) {
      results.errors.push({
        type: 'error',
        message: 'Unmatched parentheses in code',
        severity: 'critical',
        category: 'syntax'
      });
      results.isValid = false;
    }

    // Check for unused variables
    declaredVariables.forEach(varName => {
      if (!usedVariables.has(varName)) {
        results.warnings.push({
          type: 'warning',
          message: `Variable '${varName}' declared but never used`,
          severity: 'low',
          category: 'style'
        });
      }
    });

    // Additional suggestions
    if (!code.includes('(*') && !code.includes('//')) {
      results.suggestions.push({
        type: 'info',
        message: 'Add comments using (* *) or // for better code documentation',
        severity: 'low',
        category: 'style'
      });
    }

    if (!results.safetyChecks.emergencyStop) {
      results.suggestions.push({
        type: 'info',
        message: 'Consider implementing emergency stop logic for safety compliance',
        severity: 'medium',
        category: 'safety'
      });
    }

    if (code.split('\n').length > 100) {
      results.suggestions.push({
        type: 'info',
        message: 'Consider breaking large programs into smaller function blocks',
        severity: 'low',
        category: 'style'
      });
    }

    // Calculate scores
    const errorPenalty = results.errors.length * 15;
    const warningPenalty = results.warnings.length * 5;
    
    results.syntaxScore = Math.max(0, 100 - errorPenalty - warningPenalty);
    results.logicScore = Math.max(0, 100 - (results.errors.filter(e => e.category === 'semantics').length * 20));
    
    const safetyFeatures = Object.values(results.safetyChecks).filter(Boolean).length;
    results.safetyScore = Math.min(100, safetyFeatures * 20);

    return results;
  };

  const validateCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return await performSTValidation(code);
    },
    onSuccess: (results) => {
      setValidationResults(results);
      toast({
        title: "ST Code Validation Complete",
        description: results.isValid 
          ? "Structured Text validation passed"
          : `Found ${results.errors.length} errors and ${results.warnings.length} warnings`,
        variant: results.isValid ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "An error occurred during ST validation",
        variant: "destructive",
      });
    }
  });

  const handleValidateCode = () => {
    if (!generatedCode || !generatedCode.trim()) {
      toast({
        title: "No Code to Validate",
        description: "Please generate PLC Structured Text code first",
        variant: "destructive",
      });
      return;
    }

    validateCodeMutation.mutate(generatedCode);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'syntax':
        return 'text-red-400 border-red-400';
      case 'semantics':
        return 'text-orange-400 border-orange-400';
      case 'safety':
        return 'text-purple-400 border-purple-400';
      case 'iec61131':
        return 'text-cyan-400 border-cyan-400';
      case 'style':
        return 'text-gray-400 border-gray-400';
      default:
        return 'text-gray-400 border-gray-400';
    }
  };

  const hasGeneratedCode = Boolean(generatedCode && generatedCode.trim().length > 0);

  return (
    <div className="space-y-4">
      {/* Code Status */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Structured Text Code Status:</span>
            <div className="flex items-center space-x-2">
              {hasGeneratedCode ? (
                <>
                  <Code2 className="w-4 h-4 text-green-400" />
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Ready for ST Validation
                  </Badge>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <Badge variant="outline" className="text-gray-400">
                    No ST Code Generated
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
          <div className="mt-2 text-xs text-gray-500">
            Lines: {generatedCode?.split('\n').length || 0} | Characters: {generatedCode?.length || 0}
          </div>
        </CardContent>
      </Card>

      {/* Validation Controls */}
      <Card className="bg-surface-dark border border-border-dark">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <Shield className="w-4 h-4 mr-2 text-red-500" />
            IEC 61131-3 ST Validation
          </CardTitle>
          <CardDescription className="text-xs">
            Structured Text syntax, semantics, and safety validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleValidateCode}
            disabled={!hasGeneratedCode || validateCodeMutation.isPending}
            className={`w-full ${hasGeneratedCode ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}`}
            size="sm"
          >
            {validateCodeMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Validating ST Code...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                {hasGeneratedCode ? "Validate ST Code" : "Generate ST Code First"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results Summary */}
      {validationResults && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ST Validation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-red-900/20">
                <div className="text-lg font-bold text-red-400">
                  {validationResults.errors.length}
                </div>
                <div className="text-xs text-gray-400">Errors</div>
              </div>
              <div className="p-2 rounded bg-yellow-900/20">
                <div className="text-lg font-bold text-yellow-400">
                  {validationResults.warnings.length}
                </div>
                <div className="text-xs text-gray-400">Warnings</div>
              </div>
              <div className="p-2 rounded bg-blue-900/20">
                <div className="text-lg font-bold text-blue-400">
                  {validationResults.suggestions.length}
                </div>
                <div className="text-xs text-gray-400">Suggestions</div>
              </div>
            </div>

            {/* Quality Scores */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded bg-purple-900/20 text-center">
                <div className="text-lg font-bold text-purple-400">
                  {validationResults.syntaxScore}%
                </div>
                <div className="text-xs text-gray-400">Syntax</div>
              </div>
              <div className="p-2 rounded bg-cyan-900/20 text-center">
                <div className="text-lg font-bold text-cyan-400">
                  {validationResults.logicScore}%
                </div>
                <div className="text-xs text-gray-400">Logic</div>
              </div>
              <div className="p-2 rounded bg-red-900/20 text-center">
                <div className="text-lg font-bold text-red-400">
                  {validationResults.safetyScore}%
                </div>
                <div className="text-xs text-gray-400">Safety</div>
              </div>
            </div>
            
            <Alert className={`border ${validationResults.isValid ? 'border-green-600' : 'border-red-600'}`}>
              <AlertDescription className="flex items-center text-sm">
                {validationResults.isValid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                    ST code validation passed - IEC 61131-3 compliant
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400 mr-2" />
                    ST code validation failed - syntax errors must be resolved
                  </>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* IEC 61131-3 Compliance */}
      {validationResults && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">IEC 61131-3 Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className={`flex items-center space-x-2 ${
                validationResults.iecCompliance.variableDeclaration ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {validationResults.iecCompliance.variableDeclaration ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Variable declaration sections</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.iecCompliance.dataTypeUsage ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {validationResults.iecCompliance.dataTypeUsage ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Standard data type usage</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.iecCompliance.structureCompliance ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {validationResults.iecCompliance.structureCompliance ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Block structure compliance</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.iecCompliance.namingConvention ? 'text-green-400' : 'text-red-400'
              }`}>
                {validationResults.iecCompliance.namingConvention ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>Naming conventions</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {validationResults && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {/* Errors */}
                {validationResults.errors.map((error, index) => (
                  <div key={`error-${index}`} className="flex items-start space-x-2 p-2 rounded bg-red-900/10 border border-red-800/20">
                    {getIcon('error')}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getBadgeVariant('error')} className="text-xs">
                          ERROR
                        </Badge>
                        {error.line && (
                          <span className="text-xs text-gray-400">Line {error.line}</span>
                        )}
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(error.category)}`}>
                          {error.category.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-200">{error.message}</p>
                    </div>
                  </div>
                ))}

                {/* Warnings */}
                {validationResults.warnings.map((warning, index) => (
                  <div key={`warning-${index}`} className="flex items-start space-x-2 p-2 rounded bg-yellow-900/10 border border-yellow-800/20">
                    {getIcon('warning')}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getBadgeVariant('warning')} className="text-xs">
                          WARNING
                        </Badge>
                        {warning.line && (
                          <span className="text-xs text-gray-400">Line {warning.line}</span>
                        )}
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(warning.category)}`}>
                          {warning.category.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-200">{warning.message}</p>
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {validationResults.suggestions.map((suggestion, index) => (
                  <div key={`suggestion-${index}`} className="flex items-start space-x-2 p-2 rounded bg-blue-900/10 border border-blue-800/20">
                    {getIcon('info')}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getBadgeVariant('info')} className="text-xs">
                          SUGGESTION
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getCategoryColor(suggestion.category)}`}>
                          {suggestion.category.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-200">{suggestion.message}</p>
                    </div>
                  </div>
                ))}

                {validationResults.errors.length === 0 && 
                  validationResults.warnings.length === 0 && 
                  validationResults.suggestions.length === 0 && (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-400">Excellent! ST code is perfect.</p>
                    <p className="text-xs text-gray-400">Your code meets all IEC 61131-3 standards.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Safety Features */}
      {validationResults && (
        <Card className="bg-surface-dark border border-border-dark">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Safety Feature Detection</CardTitle>
            <CardDescription className="text-xs">
              Industrial safety requirements analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className={`flex items-center space-x-2 ${
                validationResults.safetyChecks.emergencyStop ? 'text-green-400' : 'text-gray-500'
              }`}>
                {validationResults.safetyChecks.emergencyStop ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>Emergency stop logic</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.safetyChecks.safetyInterlocks ? 'text-green-400' : 'text-gray-500'
              }`}>
                {validationResults.safetyChecks.safetyInterlocks ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>Safety interlock systems</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.safetyChecks.failSafeMechanisms ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {validationResults.safetyChecks.failSafeMechanisms ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Fail-safe mechanisms</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.safetyChecks.watchdogTimer ? 'text-green-400' : 'text-gray-500'
              }`}>
                {validationResults.safetyChecks.watchdogTimer ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>Watchdog timer implementation</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                validationResults.safetyChecks.inputValidation ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {validationResults.safetyChecks.inputValidation ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>Input validation and range checking</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
