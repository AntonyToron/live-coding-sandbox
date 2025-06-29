import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDatabase, syncDatabase } from './config/database';
import authRoutes from './routes/auth';
import padRoutes from './routes/pads';
import { CodeExecutionService } from './services/codeExecution';
import './models'; // Import models to set up associations

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/pads', padRoutes);

app.get('/api/health', async (req, res) => {
  const dockerStatus = await codeExecutionService.checkDockerStatus();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    docker: dockerStatus ? 'available' : 'unavailable'
  });
});

interface SocketUser {
  id: string;
  username: string;
  padId: string;
  cursor?: { line: number; column: number };
}

const connectedUsers = new Map<string, SocketUser>();
const codeExecutionService = new CodeExecutionService();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-pad', ({ padId, username }) => {
    console.log(`User ${username} joined pad ${padId}`);
    
    socket.join(padId);
    
    connectedUsers.set(socket.id, {
      id: socket.id,
      username,
      padId,
    });

    const padUsers = Array.from(connectedUsers.values())
      .filter(user => user.padId === padId);

    socket.to(padId).emit('user-joined', {
      id: socket.id,
      username,
    });

    socket.emit('pad-joined', {
      users: padUsers,
    });
  });

  socket.on('leave-pad', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.leave(user.padId);
      socket.to(user.padId).emit('user-left', {
        id: socket.id,
        username: user.username,
      });
      connectedUsers.delete(socket.id);
    }
  });

  socket.on('code-change', ({ padId, code, changes }) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.padId === padId) {
      socket.to(padId).emit('code-changed', {
        code,
        changes,
        userId: socket.id,
        username: user.username,
      });
    }
  });

  socket.on('cursor-change', ({ padId, position }) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.padId === padId) {
      user.cursor = position;
      socket.to(padId).emit('cursor-changed', {
        userId: socket.id,
        username: user.username,
        position,
      });
    }
  });

  socket.on('execute-code', async ({ padId, code, language }) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.padId === padId) {
      try {
        socket.emit('execution-started');
        
        // Execute code using Docker service
        const result = await codeExecutionService.executeCode(code, language);
        socket.emit('execution-result', result);
        
      } catch (error) {
        console.error('Code execution error:', error);
        socket.emit('execution-result', {
          success: false,
          error: error instanceof Error ? error.message : 'Execution failed',
          execution_time: 0,
        });
      }
    }
  });

  socket.on('typing-start', ({ padId }) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.padId === padId) {
      socket.to(padId).emit('typing-indicator', {
        userId: socket.id,
        username: user.username,
        isTyping: true,
      });
    }
  });

  socket.on('typing-stop', ({ padId }) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.padId === padId) {
      socket.to(padId).emit('typing-indicator', {
        userId: socket.id,
        username: user.username,
        isTyping: false,
      });
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.to(user.padId).emit('user-left', {
        id: socket.id,
        username: user.username,
      });
      connectedUsers.delete(socket.id);
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    await connectDatabase();
    await syncDatabase();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();