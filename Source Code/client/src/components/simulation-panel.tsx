import { useState, useEffect, useRef } from "react";
import { Play, Square, StepForward, RotateCcw, Gauge, Activity, Zap, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// UI Components
const Button = ({ children, onClick, disabled, size = "default", variant = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3 text-sm",
    lg: "h-11 rounded-md px-8",
  };
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-600 bg-transparent text-gray-300 hover:bg-gray-800 hover:text-white",
    secondary: "bg-gray-700 text-gray-300 hover:bg-gray-600",
  };
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", type = "text", ...props }) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

const Label = ({ children, className = "", ...props }) => {
  return (
    <label
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

const Switch = ({ checked, onCheckedChange, disabled = false, ...props }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      disabled={disabled}
      className={`peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-600'
      }`}
      {...props}
    >
      <span
        className={`pointer-events-none block h-7 w-7 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-[24px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = "", ...props }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

const ScrollArea = ({ children, className = "", ...props }) => {
  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <div className="h-full w-full rounded-[inherit] overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Mock Project type for this example
interface Project {
  code?: string;
}

interface SimulationInput {
  name: string;
  type: string;
  value: number | boolean;
  address: string;
}

interface SimulationOutput {
  name: string;
  type: string;
  value: boolean;
  address: string;
}

interface SimulationPanelProps {
  currentProject?: Project | null;
}

export default function SimulationPanel({ currentProject }: SimulationPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [chartData, setChartData] = useState<Array<{time: number, tankLevel: number, pressure: number}>>([]);
  const [temperatureData, setTemperatureData] = useState<Array<{time: number, temperature: number}>>([]);

  const [inputs, setInputs] = useState<SimulationInput[]>([
    { name: "tank_level", type: "REAL", value: 65.3, address: "I0.0" },
    { name: "pressure", type: "REAL", value: 2.4, address: "I0.1" },
    { name: "temperature", type: "REAL", value: 23.5, address: "I0.2" },
    { name: "start_button", type: "BOOL", value: false, address: "I0.3" },
    { name: "stop_button", type: "BOOL", value: false, address: "I0.4" },
    { name: "emergency_stop", type: "BOOL", value: false, address: "I0.5" },
    { name: "auto_mode", type: "BOOL", value: true, address: "I0.6" },
  ]);

  const [outputs, setOutputs] = useState<SimulationOutput[]>([
    { name: "inlet_valve", type: "BOOL", value: false, address: "Q0.0" },
    { name: "outlet_valve", type: "BOOL", value: true, address: "Q0.1" },
    { name: "pump_motor", type: "BOOL", value: false, address: "Q0.2" },
    { name: "alarm_light", type: "BOOL", value: false, address: "Q0.3" },
    { name: "heater", type: "BOOL", value: false, address: "Q0.4" },
    { name: "cooling_fan", type: "BOOL", value: false, address: "Q0.5" },
  ]);

  const intervalRef = useRef<NodeJS.Timer | null>(null);
  
  // Simulate realistic tank behavior
  const updateSimulation = () => {
    setInputs((prevInputs) => {
      const newInputs = [...prevInputs];
      let tankLevel = newInputs.find(i => i.name === "tank_level")?.value as number;
      let pressure = newInputs.find(i => i.name === "pressure")?.value as number;
      let temperature = newInputs.find(i => i.name === "temperature")?.value as number;
      
      const inletValve = outputs.find(o => o.name === "inlet_valve")?.value;
      const outletValve = outputs.find(o => o.name === "outlet_valve")?.value;
      const pumpRunning = outputs.find(o => o.name === "pump_motor")?.value;
      const heaterOn = outputs.find(o => o.name === "heater")?.value;
      const fanOn = outputs.find(o => o.name === "cooling_fan")?.value;

      // Simulate tank level changes
      if (inletValve && tankLevel < 100) {
        tankLevel += Math.random() * 2 + 1;
      }
      if (outletValve && tankLevel > 0) {
        tankLevel -= Math.random() * 1.5 + 0.5;
      }
      if (pumpRunning && tankLevel > 5) {
        tankLevel -= Math.random() * 3 + 2;
      }

      // Simulate pressure changes
      if (pumpRunning) {
        pressure += (Math.random() - 0.5) * 0.3;
      } else {
        pressure += (Math.random() - 0.5) * 0.1;
      }
      pressure = Math.max(0, Math.min(5, pressure));

      // Simulate temperature changes
      if (heaterOn) {
        temperature += Math.random() * 2 + 0.5;
      }
      if (fanOn) {
        temperature -= Math.random() * 1.5 + 0.3;
      }
      temperature += (Math.random() - 0.5) * 0.5; // ambient fluctuation
      temperature = Math.max(10, Math.min(80, temperature));

      // Clamp tank level
      tankLevel = Math.max(0, Math.min(100, tankLevel));

      // Update inputs
      newInputs.forEach(input => {
        if (input.name === "tank_level") input.value = tankLevel;
        if (input.name === "pressure") input.value = pressure;
        if (input.name === "temperature") input.value = temperature;
      });

      return newInputs;
    });

    // Update outputs based on control logic
    setOutputs((prevOutputs) => {
      const tankLevel = inputs.find(i => i.name === "tank_level")?.value as number;
      const pressure = inputs.find(i => i.name === "pressure")?.value as number;
      const temperature = inputs.find(i => i.name === "temperature")?.value as number;
      const startBtn = inputs.find(i => i.name === "start_button")?.value as boolean;
      const emergency = inputs.find(i => i.name === "emergency_stop")?.value as boolean;
      const autoMode = inputs.find(i => i.name === "auto_mode")?.value as boolean;

      return prevOutputs.map((output) => {
        switch (output.name) {
          case "inlet_valve":
            return { ...output, value: autoMode ? tankLevel < 80 : startBtn && !emergency };
          case "outlet_valve":
            return { ...output, value: !emergency && (autoMode ? tankLevel > 20 : true) };
          case "pump_motor":
            return { ...output, value: startBtn && !emergency && tankLevel > 10 };
          case "alarm_light":
            return { ...output, value: emergency || tankLevel >= 95 || pressure >= 4.5 || temperature >= 70 };
          case "heater":
            return { ...output, value: !emergency && temperature < 25 && tankLevel > 5 };
          case "cooling_fan":
            return { ...output, value: !emergency && temperature > 45 };
          default:
            return output;
        }
      });
    });

    // Update chart data
    setChartData(prev => {
      const tankLevel = inputs.find(i => i.name === "tank_level")?.value as number;
      const pressure = inputs.find(i => i.name === "pressure")?.value as number;
      const newData = [...prev, {
        time: currentStep,
        tankLevel: tankLevel || 0,
        pressure: (pressure || 0) * 20 // Scale for visibility
      }];
      return newData.slice(-50); // Keep last 50 points
    });

    setTemperatureData(prev => {
      const temperature = inputs.find(i => i.name === "temperature")?.value as number;
      const newData = [...prev, {
        time: currentStep,
        temperature: temperature || 0
      }];
      return newData.slice(-50); // Keep last 50 points
    });
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => prev + 1);
        updateSimulation();
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, inputs, outputs, currentStep]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleStep = () => {
    setCurrentStep(prev => prev + 1);
    updateSimulation();
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setChartData([]);
    setTemperatureData([]);
    setInputs(prev => prev.map(input => ({
      ...input,
      value: input.type === "BOOL" ? false : 
            input.name === "tank_level" ? 65.3 :
            input.name === "pressure" ? 2.4 :
            input.name === "temperature" ? 23.5 : input.value
    })));
    setOutputs(prev => prev.map(o => ({ ...o, value: false })));
  };

  const updateInput = (index: number, value: string | number | boolean) => {
    setInputs(prev => prev.map((input, i) => (i === index ? { ...input, value } : input)));
  };

  const tankLevel = inputs.find(i => i.name === "tank_level")?.value as number || 0;
  const pressure = inputs.find(i => i.name === "pressure")?.value as number || 0;
  const temperature = inputs.find(i => i.name === "temperature")?.value as number || 0;

  const getOutput = (name: string) => outputs.find(o => o.name === name)?.value || false;

  return (
    <div className="space-y-4 p-4 bg-gray-900 min-h-screen">
      {/* Main Process Visualization */}
      <Card className="bg-gray-800 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Industrial Process Simulation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-900 rounded-lg p-6 min-h-96">
            {/* Tank System */}
            <div className="absolute left-30 top-10">
              {/* Inlet Pipe */}
              <div className="relative">
                <div className={`w-16 h-4 border-2 ${getOutput('inlet_valve') ? 'border-blue-400' : 'border-gray-600'} rounded-l-lg`}>
                  {getOutput('inlet_valve') && (
                    <div className="w-full h-full bg-blue-400 rounded-l-lg animate-pulse"></div>
                  )}
                </div>
                <div className="absolute -top-6 left-2 text-xs text-gray-400">Inlet</div>
                {/* Valve indicator */}
                <div className={`absolute -top-2 -right-2 w-6 h-6 border-2 ${getOutput('inlet_valve') ? 'border-green-400 bg-green-400' : 'border-gray-600'} rounded transform rotate-45`}></div>
              </div>

              {/* Main Tank */}
              <div className="relative w-32 h-48 border-4 border-gray-600 rounded-b-lg bg-gray-800 mt-4">
                {/* Tank Level */}
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-b-lg transition-all duration-1000 ease-out"
                  style={{ height: `${Math.max(0, Math.min(100, tankLevel))}%` }}
                >
                  {/* Liquid animation */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-blue-300 opacity-60 animate-pulse"></div>
                </div>
                
                {/* Tank Level Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-70 px-2 py-1 rounded text-white text-sm font-bold">
                    {tankLevel.toFixed(1)}%
                  </div>
                </div>

                {/* Overflow indicator */}
                {tankLevel >= 95 && (
                  <div className="absolute -top-4 left-0 w-full h-4 bg-red-500 animate-bounce rounded-t-lg">
                    <AlertTriangle className="w-4 h-4 text-white mx-auto" />
                  </div>
                )}
              </div>

              {/* Outlet Pipe */}
              <div className="relative mt-2">
                <div className={`w-16 h-4 border-2 ${getOutput('outlet_valve') ? 'border-blue-400' : 'border-gray-600'} rounded-r-lg`}>
                  {getOutput('outlet_valve') && (
                    <div className="w-full h-full bg-blue-400 rounded-r-lg animate-pulse"></div>
                  )}
                </div>
                <div className="absolute -bottom-6 left-2 text-xs text-gray-400">Outlet</div>
                {/* Valve indicator */}
                <div className={`absolute -top-2 -left-2 w-6 h-6 border-2 ${getOutput('outlet_valve') ? 'border-green-400 bg-green-400' : 'border-gray-600'} rounded transform rotate-45`}></div>
              </div>
            </div>

            {/* Pump System */}
            <div className="absolute left-60 top-32">
              <div className={`w-16 h-16 border-4 ${getOutput('pump_motor') ? 'border-green-400' : 'border-gray-600'} rounded-full bg-gray-700 flex items-center justify-center`}>
                <Zap className={`w-8 h-8 ${getOutput('pump_motor') ? 'text-green-400 animate-spin' : 'text-gray-500'}`} />
              </div>
              <div className="text-xs text-gray-400 text-center mt-2">Pump Motor</div>
            </div>

            {/* Heating/Cooling System */}
            <div className="absolute right-20 top-16">
              <div className="space-y-4">
                {/* Heater */}
                <div className={`w-12 h-12 border-4 ${getOutput('heater') ? 'border-red-400' : 'border-gray-600'} rounded bg-gray-700 flex items-center justify-center`}>
                  <div className={`w-6 h-6 rounded ${getOutput('heater') ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                </div>
                <div className="text-xs text-gray-400 text-center">Heater</div>
                
                {/* Cooling Fan */}
                <div className={`w-12 h-12 border-4 ${getOutput('cooling_fan') ? 'border-cyan-400' : 'border-gray-600'} rounded-full bg-gray-700 flex items-center justify-center`}>
                  <div className={`w-8 h-1 ${getOutput('cooling_fan') ? 'bg-cyan-400' : 'bg-gray-500'} ${getOutput('cooling_fan') ? 'animate-spin' : ''}`}></div>
                  <div className={`w-1 h-8 ${getOutput('cooling_fan') ? 'bg-cyan-400' : 'bg-gray-500'} absolute`}></div>
                </div>
                <div className="text-xs text-gray-400 text-center">Fan</div>
              </div>
            </div>

            {/* Alarm Light */}
            <div className="absolute top-4 right-4">
              <div className={`w-8 h-8 rounded-full ${getOutput('alarm_light') ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500' : 'bg-gray-600'} border-2 border-gray-400`}>
                {getOutput('alarm_light') && (
                  <AlertTriangle className="w-6 h-6 text-white m-auto mt-0.5" />
                )}
              </div>
              <div className="text-xs text-gray-400 text-center mt-1">Alarm</div>
            </div>

            {/* Pressure Gauge */}
            <div className="absolute bottom-4 right-20">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-600" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="none" 
                    className={pressure > 4 ? "text-red-400" : pressure > 3 ? "text-yellow-400" : "text-green-400"}
                    strokeDasharray={`${pressure * 56.55} 283`}
                    strokeDashoffset="70.875"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-white font-bold">{pressure.toFixed(1)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 text-center">Bar</div>
            </div>

            {/* Temperature Display */}
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center space-x-2">
                <Gauge className="w-6 h-6 text-gray-400" />
                <div>
                  <div className={`text-lg font-bold ${temperature > 60 ? 'text-red-400' : temperature < 15 ? 'text-blue-400' : 'text-green-400'}`}>
                    {temperature.toFixed(1)}°C
                  </div>
                  <div className="text-xs text-gray-400">Temperature</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panels and I/O Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Simulation Controls & I/O */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Simulation Control</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={handleStart} disabled={isRunning} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Play className="w-3 h-3 mr-1" /> Start
                </Button>
                <Button onClick={handleStop} disabled={!isRunning} size="sm" variant="outline">
                  <Square className="w-3 h-3 mr-1" /> Stop
                </Button>
                <Button onClick={handleStep} size="sm" variant="outline">
                  <StepForward className="w-3 h-3 mr-1" /> Step
                </Button>
                <Button onClick={handleReset} size="sm" variant="outline">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>
              <div className="flex justify-between text-xs text-gray-300">
                <span>Cycle: {currentStep}</span>
                <span className={isRunning ? "text-green-400" : "text-gray-400"}>
                  {isRunning ? "● Running" : "○ Stopped"}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Virtual Inputs and Outputs side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Virtual Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-70">
                  <div className="space-y-3">
                    {inputs.map((input, idx) => (
                      <div key={input.name} className="flex justify-between items-center p-4 bg-gray-900 rounded">
                        <div className="flex-1">
                          <Label className="text-sm text-white capitalize">{input.name.replace('_', ' ')}</Label>
                          <p className="text-sm text-gray-400">{input.type} • {input.address}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {input.type === "BOOL" ? (
                            <Switch 
                              checked={input.value as boolean} 
                              onCheckedChange={(val) => updateInput(idx, val)} 
                              disabled={isRunning && !['start_button', 'stop_button', 'emergency_stop', 'auto_mode'].includes(input.name)}
                            />
                          ) : (
                            <Input 
                              type="number" 
                              step="0.1" 
                              value={input.value as number} 
                              onChange={(e) => updateInput(idx, parseFloat(e.target.value) || 0)} 
                              disabled={isRunning}
                              className="w-24 h-10 text-sm bg-gray-700 border-gray-600 text-white" 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Virtual Outputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {outputs.map(output => (
                    <div key={output.name} className="flex flex-col items-center p-4 bg-gray-900 rounded">
                      <div className={`w-12 h-12 rounded-full mb-2 border-2 flex items-center justify-center ${
                        output.value 
                          ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50' 
                          : 'bg-gray-600 border-gray-500'
                      }`}>
                        {output.value && <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>}
                      </div>
                      <span className="text-sm text-center text-gray-300 capitalize">
                        {output.name.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">{output.address}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Real-time Monitoring Charts */}
        <div className="space-y-4">
          <Card className="bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Level & Pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tankLevel" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Tank Level (%)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pressure" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Pressure (Bar x20)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={temperatureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#F9FAFB'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Temperature (°C)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}