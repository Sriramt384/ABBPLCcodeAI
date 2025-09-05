# PLC Code Development Environment

## Overview

This is a comprehensive PLC (Programmable Logic Controller) development environment that combines AI-powered code generation with traditional PLC programming tools. The application specializes in IEC 61131-3 compliant code development, featuring natural language to PLC code conversion, template-based development, simulation capabilities, and multi-platform export functionality. Built as a full-stack web application with React frontend and Express backend, it provides an integrated development environment for industrial automation programming.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom industrial theming (ABB blue color scheme)
- **State Management**: TanStack Query for server state management
- **Code Editor**: Monaco Editor with custom PLC/IEC 61131-3 syntax highlighting
- **Routing**: Wouter for client-side navigation

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses
- **Development**: Hot reload with Vite middleware integration

### Database & Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (Neon serverless in production)
- **Schema Management**: Drizzle Kit for migrations
- **Storage Interface**: Abstracted storage layer with in-memory fallback for development

### Core Data Models
- **Projects**: Main containers for PLC programs with code, variables, and metadata
- **Templates**: Reusable code snippets categorized by industrial applications
- **Code Generations**: AI-generated code with natural language inputs and validation
- **Simulations**: Virtual PLC execution with input/output mappings

### AI Integration Architecture
- **Provider**: OpenAI GPT-4o for code generation and analysis
- **Capabilities**: Natural language to PLC code conversion, code validation, reverse engineering
- **Output Formats**: Structured Text, Ladder Logic (planned), Function Block (planned)
- **Validation**: Syntax checking and IEC 61131-3 compliance verification

### Component Organization
- **Modular Panels**: Sidebar with collapsible sections for different tools
- **Code Editor**: Integrated Monaco editor with PLC syntax highlighting
- **Properties Panel**: Real-time variable monitoring and project information
- **Tool Panels**: Dedicated interfaces for code generation, templates, simulation, validation, reverse engineering, and export

### Industrial Features
- **PLC Languages**: Primary support for Structured Text with IEC 61131-3 compliance
- **Variable Management**: Typed variables with industrial data types (BOOL, INT, REAL, etc.)
- **Template System**: Pre-built patterns for motor control, valve control, conveyors, and safety interlocks
- **Simulation Engine**: Virtual I/O mapping with real-time variable updates
- **Export Compatibility**: Multi-platform support (ABB Automation Builder, Siemens TIA Portal, Rockwell Studio 5000, CODESYS)

### Development Workflow
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
- **Path Aliases**: Organized imports with @ prefixes for components, shared types, and utilities
- **Hot Reload**: Development server with automatic refresh for code changes

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for natural language processing and code generation
- **Anthropic SDK**: Alternative AI provider integration (configured but not actively used)

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management for production scalability

### Development Tools
- **Replit Integration**: Native support for Replit development environment with runtime error overlay
- **Monaco Editor**: Advanced code editor with syntax highlighting and IntelliSense
- **Cartographer**: Development mode visualization tool

### UI Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Modern icon library for consistent iconography

### Build & Development
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **ESBuild**: Fast JavaScript bundler for production builds

### Session Management
- **Express Session**: Server-side session management
- **Connect PG Simple**: PostgreSQL-backed session store for production persistence

### Validation & Forms
- **Zod**: Runtime type validation for API requests and responses
- **React Hook Form**: Form state management with validation integration
- **Drizzle Zod**: Automatic schema validation generation from database models