# Employee Attendance Management System

## Overview

A full-stack web application for managing employee attendance with real-time check-in/check-out functionality. The system displays employee lists with attendance status indicators and provides an intuitive interface for toggling attendance status. Built with React frontend, Express backend, and PostgreSQL database, featuring a Japanese-localized UI designed for Japanese workplace environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming, including custom attendance status colors
- **State Management**: TanStack Query (React Query) for server state management with automatic caching and synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Japanese-localized interface with Noto Sans JP font for proper Japanese text rendering

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API endpoints
- **Development**: Hot-reload development server with custom logging middleware for API request tracking
- **Storage Layer**: Abstracted storage interface allowing for multiple implementations (currently in-memory storage with sample data)
- **API Design**: RESTful endpoints for employee management and attendance operations with proper error handling

### Data Storage Solutions
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe schema definitions
- **Database**: PostgreSQL (via Neon Database) for production data persistence
- **Schema**: Separate tables for employees and attendance records with proper foreign key relationships
- **Development Storage**: In-memory storage implementation with pre-populated Japanese employee sample data for development and testing

### Key Features
- **Real-time Attendance Tracking**: Live status updates with automatic refresh intervals
- **Three-state Attendance System**: Not checked in, working, and checked out status management
- **Statistics Dashboard**: Real-time attendance statistics with footer display
- **Responsive Design**: Mobile-first design with proper responsive breakpoints
- **Visual Status Indicators**: Color-coded status system with legend for easy identification

### API Structure
- `GET /api/employees` - Retrieve all employees with today's attendance status
- `POST /api/employees/:id/toggle-attendance` - Toggle employee attendance status
- `GET /api/attendance/stats` - Get real-time attendance statistics

The architecture supports easy extension for additional features like historical attendance tracking, department-based filtering, and admin management capabilities.