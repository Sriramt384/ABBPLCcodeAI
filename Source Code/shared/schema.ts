import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").default(""),
  language: text("language").default("structured_text"), // structured_text, ladder_logic, function_block
  variables: json("variables").$type<Variable[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // motor_control, valve_control, conveyor, interlock
  description: text("description"),
  code: text("code").notNull(),
  language: text("language").default("structured_text"),
  variables: json("variables").$type<Variable[]>().default([]),
  isBuiltIn: boolean("is_built_in").default(false),
});

export const codeGenerations = pgTable("code_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  naturalLanguageInput: text("natural_language_input").notNull(),
  generatedCode: text("generated_code").notNull(),
  language: text("language").default("structured_text"),
  validationResults: json("validation_results").$type<ValidationResult[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  inputs: json("inputs").$type<SimulationInput[]>().default([]),
  outputs: json("outputs").$type<SimulationOutput[]>().default([]),
  isRunning: boolean("is_running").default(false),
  currentStep: text("current_step").default("0"),
});

// Types
export type Variable = {
  name: string;
  type: string; // BOOL, REAL, INT, DINT, etc.
  value?: string | number | boolean;
  description?: string;
  address?: string;
};

export type ValidationResult = {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
  column?: number;
};

export type SimulationInput = {
  name: string;
  type: string;
  value: string | number | boolean;
  address?: string;
};

export type SimulationOutput = {
  name: string;
  type: string;
  value: string | number | boolean;
  address?: string;
};

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
});

export const insertCodeGenerationSchema = createInsertSchema(codeGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
});

// Inferred types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export type InsertCodeGeneration = z.infer<typeof insertCodeGenerationSchema>;
export type CodeGeneration = typeof codeGenerations.$inferSelect;

export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulations.$inferSelect;
