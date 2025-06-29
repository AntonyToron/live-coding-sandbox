# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a live coding platform built with a Turborepo monorepo structure. It enables real-time collaborative code editing with secure code execution, user authentication, and shareable coding sessions.

## Development Commands

### Root Level (All Apps)
```bash
yarn dev          # Start all applications in development mode
yarn build        # Build all applications
yarn lint         # Lint all applications
yarn type-check   # Type check all applications
yarn clean        # Clean build artifacts
```

### Database Setup
```bash
docker compose up -d    # Start PostgreSQL and Redis services
docker compose down     # Stop services
```

### Backend (apps/backend)
```bash
cd apps/backend
yarn dev          # Start development server with nodemon
yarn build        # Compile TypeScript to dist/
yarn start        # Start production server
yarn lint         # ESLint check
yarn type-check   # TypeScript type checking
yarn clean        # Remove dist/ directory
```

### Frontend (apps/frontend)
```bash
cd apps/frontend
yarn dev          # Start Next.js development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Next.js linting
yarn type-check   # TypeScript type checking
yarn clean        # Remove .next/ directory
```

## Architecture Overview

### Backend (Node.js + Express + Socket.io)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time**: Socket.io for collaborative editing
- **Authentication**: JWT tokens with bcrypt password hashing
- **Structure**:
  - `src/config/` - Database configuration
  - `src/models/` - Sequelize models (User, Pad, PadSession)
  - `src/routes/` - API endpoints (auth, pads)
  - `src/middleware/` - Auth middleware
  - `src/services/` - Business logic services
  - `src/types/` - TypeScript type definitions

### Frontend (Next.js 14 + App Router)
- **Framework**: Next.js 14 with App Router and TypeScript
- **Editor**: Monaco Editor for code editing
- **Real-time**: Socket.io client for collaboration
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios for API calls

### Database Schema
- **Users**: Authentication and user management
- **Pads**: Code pads with language, content, and sharing
- **PadSessions**: Real-time collaboration sessions

### Real-time Features
- Live collaborative code editing
- Cursor position tracking
- User presence indicators
- Code execution with live output
- Typing indicators

## Environment Setup

### Backend Environment Variables (.env)
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/live_coding_platform
JWT_SECRET=your-jwt-secret-key
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Docker Services
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Pads Management
- `GET /api/pads` - List user's pads
- `POST /api/pads` - Create new pad
- `GET /api/pads/:id` - Get pad by ID
- `PUT /api/pads/:id` - Update pad
- `DELETE /api/pads/:id` - Delete pad
- `POST /api/pads/:id/share` - Generate share token
- `GET /api/pads/share/:token` - Access shared pad

## Socket.io Events

### Client → Server
- `join-pad` - Join collaborative session
- `leave-pad` - Leave session
- `code-change` - Broadcast code changes
- `cursor-change` - Update cursor position
- `execute-code` - Run code execution
- `typing-start/stop` - Typing indicators

### Server → Client
- `pad-joined` - Session joined successfully
- `code-changed` - Receive code updates
- `cursor-changed` - Other users' cursors
- `user-joined/left` - User presence updates
- `execution-started/result` - Code execution feedback
- `typing-indicator` - Show typing status

## Code Execution
- Docker-based isolated execution (TODO: implement)
- Supported languages: JavaScript, TypeScript, Python, Java, Go, Rust, C++
- Resource limits and security sandboxing
- Real-time output streaming via WebSocket