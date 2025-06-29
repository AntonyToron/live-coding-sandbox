# Live Coding Platform

A real-time collaborative code editing platform with secure code execution, built with Next.js, Node.js, and Docker.

## Features

- 🚀 Real-time collaborative code editing with Monaco Editor
- 🔐 JWT-based authentication system
- 🐳 Secure Docker-based code execution
- 🌐 Socket.io for live collaboration
- 📱 Responsive design with Tailwind CSS
- 🎯 Support for JavaScript, TypeScript, Python, Java, Go, Rust, and C++
- 👥 Live user presence and cursor tracking
- 📝 Shareable coding pads
- ⚡ Hot reload development environment

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Monaco Editor, Socket.io Client, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Socket.io, Sequelize
- **Database**: PostgreSQL
- **Code Execution**: Docker containers
- **Monorepo**: Turborepo with Yarn workspaces

## Prerequisites

### macOS (via Homebrew)

```bash
# Install Node.js
brew install node

# Install Yarn
brew install yarn

# Install Docker Desktop
brew install --cask docker

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install yarn

# Install Docker
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Linux (CentOS/RHEL/Fedora)

```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs npm

# Install Yarn
curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo dnf install yarn

# Install Docker
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker

# Install PostgreSQL
sudo dnf install postgresql postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd live-coding-platform
yarn install
```

### 2. Setup Database

**Option A: Using Docker (Recommended)**

```bash
# Start PostgreSQL and Redis with Docker
docker compose up -d

# Verify services are running
docker compose ps
```

**Option B: Local PostgreSQL**

```bash
# Create database
createdb live_coding_platform

# Update backend/.env with your local database URL
# DATABASE_URL=postgresql://username:password@localhost:5432/live_coding_platform
```

### 3. Configure Environment Variables

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Frontend environment (if needed)
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

### 4. Start Development Servers

```bash
# Start all services (backend + frontend)
yarn dev

# Or start individually:
# Backend only (with hot reload)
cd apps/backend && yarn dev

# Frontend only
cd apps/frontend && yarn dev
```

### 5. Verify Docker Integration

Visit `http://localhost:5000/api/health` to check if Docker is available for code execution.

## Development Commands

### Root Level (All Apps)
```bash
yarn dev          # Start all applications in development mode
yarn build        # Build all applications
yarn lint         # Lint all applications
yarn type-check   # Type check all applications
yarn clean        # Clean build artifacts
```

### Backend (apps/backend)
```bash
cd apps/backend
yarn dev          # Start with hot reload (nodemon + ts-node)
yarn build        # Compile TypeScript to dist/
yarn start        # Start production server
yarn lint         # ESLint check
yarn type-check   # TypeScript type checking
yarn clean        # Remove dist/ directory
```

### Frontend (apps/frontend)
```bash
cd apps/frontend
yarn dev          # Start Next.js development server with Turbopack
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Next.js linting
yarn type-check   # TypeScript type checking
yarn clean        # Remove .next/ directory
```

## Docker Images

The platform uses the following Docker images for code execution:

- **JavaScript/TypeScript**: `node:18-alpine`
- **Python**: `python:3.11-alpine`
- **Java**: `openjdk:17-alpine`
- **Go**: `golang:1.21-alpine`
- **Rust**: `rust:1.75-alpine`
- **C++**: `gcc:12-alpine`

Images are automatically pulled when first needed.

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

### System
- `GET /api/health` - Health check with Docker status

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

## Security Features

- JWT-based authentication
- Docker container isolation for code execution
- No network access in execution containers
- Resource limits (128MB memory, 0.5 CPU, 10s timeout)
- Input sanitization and validation
- Read-only file system for code execution

## Troubleshooting

### Docker Issues

```bash
# Check Docker status
docker --version
docker ps

# Test Docker permissions (Linux)
docker run hello-world

# Restart Docker service (Linux)
sudo systemctl restart docker
```

### Database Issues

```bash
# Check PostgreSQL status
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Test database connection
psql -U postgres -d live_coding_platform -c "SELECT 1;"
```

### Port Conflicts

Default ports:
- Frontend: `3000`
- Backend: `5000`
- PostgreSQL: `5432`
- Redis: `6379`

Change ports in environment files if needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `yarn lint` and `yarn type-check`
6. Submit a pull request

## License

This project is licensed under the MIT License.
