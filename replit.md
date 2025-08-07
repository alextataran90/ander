# Overview

Ander is a modern blood sugar tracking application designed specifically for gestational diabetes management. The app features an iOS-optimized design with a futuristic glassmorphism aesthetic and comprehensive data visualization capabilities. Built as a full-stack TypeScript application with Supabase backend, it provides real-time blood sugar monitoring, meal tracking, activity logging, detailed insights, and comprehensive history management with PDF export functionality to help users manage their health effectively.

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

The application uses a hybrid approach with Supabase as the primary backend:

- **Primary Backend**: Supabase for authentication, real-time database, and file storage
- **Local API**: Express.js with TypeScript for additional processing and legacy endpoints
- **Authentication**: Supabase Auth with email/password authentication and protected routes
- **Database**: PostgreSQL via Supabase with strongly typed schema using Drizzle ORM
- **File Storage**: Supabase Storage for meal photos and PDF reports
- **Data Validation**: Zod schemas shared between client and server for consistent validation

Key features include:
- User-specific data isolation with `user_id` foreign keys
- Real-time data synchronization via Supabase
- Secure file uploads with automatic URL generation
- PDF report generation and storage capabilities

## Data Storage Solutions

The application uses Supabase as the primary data storage solution:

- **Primary Database**: Supabase PostgreSQL with real-time capabilities
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **File Storage**: Supabase Storage buckets for meal photos and PDF reports
- **Schema Design**: Strongly typed database schema with user isolation and enums

The data model includes:
- User-specific blood sugar readings with decimal precision
- Meal type categorization (breakfast, lunch, dinner, snack)
- Activity level tracking (low, moderate, high)
- Carbohydrate intake logging with validation
- Optional notes and meal image attachments
- Automatic timestamp generation and user association
- PDF report generation and storage capabilities

## Authentication and Authorization

Comprehensive authentication system implemented with Supabase Auth:

- **User Management**: Complete signup/login system with email verification
- **Session Management**: Automatic session persistence and refresh tokens
- **Route Protection**: Protected routes that require authentication
- **Data Isolation**: User-specific data access with `user_id` filtering
- **Security Features**: Email confirmation, secure session handling, and logout functionality

Features include:
- Email/password authentication with Supabase
- Automatic redirect handling for email confirmations
- Loading states and error handling for auth operations
- Context-based authentication state management throughout the app

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