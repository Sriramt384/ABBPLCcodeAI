import { 
  type Project, 
  type InsertProject,
  type Template,
  type InsertTemplate,
  type CodeGeneration,
  type InsertCodeGeneration,
  type Simulation,
  type InsertSimulation,
  type Variable
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Templates
  getTemplate(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;

  // Code Generations
  getCodeGeneration(id: string): Promise<CodeGeneration | undefined>;
  getCodeGenerationsByProject(projectId: string): Promise<CodeGeneration[]>;
  createCodeGeneration(generation: InsertCodeGeneration): Promise<CodeGeneration>;

  // Simulations
  getSimulation(id: string): Promise<Simulation | undefined>;
  getSimulationsByProject(projectId: string): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  updateSimulation(id: string, updates: Partial<InsertSimulation>): Promise<Simulation | undefined>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;
  private templates: Map<string, Template>;
  private codeGenerations: Map<string, CodeGeneration>;
  private simulations: Map<string, Simulation>;

  constructor() {
    this.projects = new Map();
    this.templates = new Map();
    this.codeGenerations = new Map();
    this.simulations = new Map();
    this.seedTemplates();
  }

  private seedTemplates() {
    const builtInTemplates: InsertTemplate[] = [
      {
        name: "Motor Start/Stop",
        category: "motor_control",
        description: "Basic motor control with start/stop functionality",
        code: `PROGRAM MotorControl
VAR
    start_button : BOOL;
    stop_button : BOOL;
    motor_running : BOOL;
    motor_output : BOOL;
END_VAR

// Motor control logic
IF start_button AND NOT stop_button THEN
    motor_running := TRUE;
ELSIF stop_button THEN
    motor_running := FALSE;
END_IF;

motor_output := motor_running;

END_PROGRAM`,
        language: "structured_text",
        variables: [
          { name: "start_button", type: "BOOL", description: "Motor start button input" },
          { name: "stop_button", type: "BOOL", description: "Motor stop button input" },
          { name: "motor_running", type: "BOOL", description: "Motor running status" },
          { name: "motor_output", type: "BOOL", description: "Motor control output" }
        ],
        isBuiltIn: true
      },
      {
        name: "Tank Level Control",
        category: "valve_control",
        description: "Tank level control with high/low alarms",
        code: `PROGRAM TankLevelControl
VAR
    tank_level : REAL;
    high_level_alarm : BOOL;
    low_level_alarm : BOOL;
    fill_valve : BOOL;
    drain_valve : BOOL;
    high_setpoint : REAL := 90.0;
    low_setpoint : REAL := 10.0;
END_VAR

// High level alarm
IF tank_level > high_setpoint THEN
    high_level_alarm := TRUE;
    fill_valve := FALSE;
ELSE
    high_level_alarm := FALSE;
END_IF;

// Low level alarm
IF tank_level < low_setpoint THEN
    low_level_alarm := TRUE;
    drain_valve := FALSE;
ELSE
    low_level_alarm := FALSE;
END_IF;

END_PROGRAM`,
        language: "structured_text",
        variables: [
          { name: "tank_level", type: "REAL", description: "Current tank level" },
          { name: "high_level_alarm", type: "BOOL", description: "High level alarm output" },
          { name: "low_level_alarm", type: "BOOL", description: "Low level alarm output" },
          { name: "fill_valve", type: "BOOL", description: "Fill valve control" },
          { name: "drain_valve", type: "BOOL", description: "Drain valve control" }
        ],
        isBuiltIn: true
      },
      {
        name: "Conveyor System",
        category: "conveyor",
        description: "Basic conveyor belt control with safety interlocks",
        code: `PROGRAM ConveyorControl
VAR
    conveyor_start : BOOL;
    conveyor_stop : BOOL;
    emergency_stop : BOOL;
    safety_guard : BOOL;
    conveyor_motor : BOOL;
    conveyor_running : BOOL;
END_VAR

// Safety interlocks
IF NOT emergency_stop AND safety_guard THEN
    // Normal operation
    IF conveyor_start AND NOT conveyor_stop THEN
        conveyor_running := TRUE;
    ELSIF conveyor_stop THEN
        conveyor_running := FALSE;
    END_IF;
ELSE
    // Safety stop
    conveyor_running := FALSE;
END_IF;

conveyor_motor := conveyor_running;

END_PROGRAM`,
        language: "structured_text",
        variables: [
          { name: "conveyor_start", type: "BOOL", description: "Conveyor start button" },
          { name: "conveyor_stop", type: "BOOL", description: "Conveyor stop button" },
          { name: "emergency_stop", type: "BOOL", description: "Emergency stop button" },
          { name: "safety_guard", type: "BOOL", description: "Safety guard status" },
          { name: "conveyor_motor", type: "BOOL", description: "Conveyor motor output" }
        ],
        isBuiltIn: true
      }
    ];

    builtInTemplates.forEach(template => {
      const id = randomUUID();
      this.templates.set(id, { 
        ...template, 
        id,
        description: template.description || null,
        language: template.language || null,
        variables: template.variables || null,
        isBuiltIn: template.isBuiltIn || null
      });
    });
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const now = new Date();
    const project: Project = { 
      ...insertProject,
      description: insertProject.description || null,
      code: insertProject.code || null,
      language: insertProject.language || null,
      variables: insertProject.variables || null,
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;

    const updated: Project = { 
      ...existing, 
      ...updates,
      description: updates.description !== undefined ? updates.description : existing.description,
      code: updates.code !== undefined ? updates.code : existing.code,
      language: updates.language !== undefined ? updates.language : existing.language,
      variables: updates.variables !== undefined ? updates.variables : existing.variables,
      updatedAt: new Date() 
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Templates
  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const template: Template = { 
      ...insertTemplate, 
      id,
      description: insertTemplate.description || null,
      language: insertTemplate.language || null,
      variables: insertTemplate.variables || null,
      isBuiltIn: insertTemplate.isBuiltIn || null
    };
    this.templates.set(id, template);
    return template;
  }

  // Code Generations
  async getCodeGeneration(id: string): Promise<CodeGeneration | undefined> {
    return this.codeGenerations.get(id);
  }

  async getCodeGenerationsByProject(projectId: string): Promise<CodeGeneration[]> {
    return Array.from(this.codeGenerations.values()).filter(g => g.projectId === projectId);
  }

  async createCodeGeneration(insertGeneration: InsertCodeGeneration): Promise<CodeGeneration> {
    const id = randomUUID();
    const generation: CodeGeneration = { 
      ...insertGeneration,
      projectId: insertGeneration.projectId || null,
      language: insertGeneration.language || null,
      validationResults: insertGeneration.validationResults || null,
      id, 
      createdAt: new Date() 
    };
    this.codeGenerations.set(id, generation);
    return generation;
  }

  // Simulations
  async getSimulation(id: string): Promise<Simulation | undefined> {
    return this.simulations.get(id);
  }

  async getSimulationsByProject(projectId: string): Promise<Simulation[]> {
    return Array.from(this.simulations.values()).filter(s => s.projectId === projectId);
  }

  async createSimulation(insertSimulation: InsertSimulation): Promise<Simulation> {
    const id = randomUUID();
    const simulation: Simulation = { 
      ...insertSimulation, 
      id,
      projectId: insertSimulation.projectId || null,
      inputs: insertSimulation.inputs || null,
      outputs: insertSimulation.outputs || null,
      isRunning: insertSimulation.isRunning || null,
      currentStep: insertSimulation.currentStep || null
    };
    this.simulations.set(id, simulation);
    return simulation;
  }

  async updateSimulation(id: string, updates: Partial<InsertSimulation>): Promise<Simulation | undefined> {
    const existing = this.simulations.get(id);
    if (!existing) return undefined;

    const updated: Simulation = { 
      ...existing, 
      ...updates,
      projectId: updates.projectId !== undefined ? updates.projectId : existing.projectId,
      inputs: updates.inputs !== undefined ? updates.inputs : existing.inputs,
      outputs: updates.outputs !== undefined ? updates.outputs : existing.outputs,
      isRunning: updates.isRunning !== undefined ? updates.isRunning : existing.isRunning,
      currentStep: updates.currentStep !== undefined ? updates.currentStep : existing.currentStep
    };
    this.simulations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
