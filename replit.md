# Overview

Ander is a modern blood sugar tracking application designed specifically for gestational diabetes management. The app features an iOS-optimized design with a futuristic glassmorphism aesthetic and comprehensive data visualization capabilities. Built as a full-stack TypeScript application, it provides real-time blood sugar monitoring, meal tracking, activity logging, and detailed insights to help users manage their health effectively.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built with React and TypeScript, utilizing a component-based architecture with modern tooling:

- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessible, customizable interfaces
- **Styling**: Tailwind CSS with custom glassmorphism design system and iOS-inspired color palette
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

The app follows a mobile-first design approach with PWA capabilities, featuring:
- Glassmorphism UI design with custom CSS variables
- Haptic feedback integration for iOS-like interactions
- Responsive layout optimized for mobile devices
- Theme switching (light/dark mode) with persistent preferences

## Backend Architecture

The server-side uses Express.js with TypeScript in a RESTful API pattern:

- **Framework**: Express.js with TypeScript for robust server-side development
- **API Design**: RESTful endpoints for blood sugar reading CRUD operations
- **Data Storage**: In-memory storage implementation with interface-based design for easy database integration
- **Validation**: Zod schemas shared between client and server for consistent data validation
- **Error Handling**: Centralized error handling middleware with structured error responses

Key API endpoints include:
- `GET /api/blood-sugar-readings` - Retrieve all readings
- `POST /api/blood-sugar-readings` - Create new reading
- `PATCH /api/blood-sugar-readings/:id` - Update existing reading
- `DELETE /api/blood-sugar-readings/:id` - Remove reading
- `GET /api/blood-sugar-stats` - Retrieve aggregated statistics

## Data Storage Solutions

The application uses a flexible storage architecture:

- **Current Implementation**: In-memory storage using Map data structures for development and testing
- **Database Ready**: Drizzle ORM configuration with PostgreSQL schema definitions
- **Migration Support**: Drizzle Kit for database migrations and schema management
- **Schema Design**: Strongly typed database schema with enums for meal types and activity levels

The data model includes:
- Blood sugar readings with decimal precision
- Meal type categorization (breakfast, lunch, dinner, snack)
- Activity level tracking (low, moderate, high)
- Carbohydrate intake logging
- Optional notes field for additional context
- Automatic timestamp generation

## Authentication and Authorization

Currently implemented as a single-user application without authentication. The architecture supports future implementation of:
- User session management
- Role-based access control
- Secure API endpoints
- Data isolation between users

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver for serverless environments
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### UI and UX Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **@tanstack/react-query**: Powerful data synchronization for React applications
- **react-hook-form**: Performant forms with easy validation
- **wouter**: Minimalist routing library for React
- **tailwindcss**: Utility-first CSS framework
- **date-fns**: Modern JavaScript date utility library

### Development Tools
- **vite**: Next-generation frontend tooling
- **typescript**: Static type checking
- **tsx**: TypeScript execution environment
- **esbuild**: Fast JavaScript bundler for production builds

### Database and Validation
- **zod**: TypeScript-first schema validation
- **connect-pg-simple**: PostgreSQL session store for Express
- **nanoid**: URL-safe unique string ID generator

The application is designed with modularity and scalability in mind, allowing for easy integration of additional features like user authentication, data export, advanced analytics, and third-party health service integrations.