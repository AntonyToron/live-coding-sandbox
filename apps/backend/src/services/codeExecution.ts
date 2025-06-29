import Docker from 'dockerode';
import { ProgrammingLanguage, ExecutionResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

const docker = new Docker();

interface ExecutionConfig {
  image: string;
  cmd: string[];
  fileExtension: string;
  filename?: string;
}

const LANGUAGE_CONFIGS: Record<ProgrammingLanguage, ExecutionConfig> = {
  javascript: {
    image: 'node:18-alpine',
    cmd: ['node'],
    fileExtension: 'js',
    filename: 'index.js'
  },
  typescript: {
    image: 'node:18-alpine',
    cmd: ['sh', '-c', 'npm install -g typescript && npx ts-node'],
    fileExtension: 'ts',
    filename: 'index.ts'
  },
  python: {
    image: 'python:3.11-alpine',
    cmd: ['python'],
    fileExtension: 'py',
    filename: 'main.py'
  },
  java: {
    image: 'openjdk:17-alpine',
    cmd: ['sh', '-c', 'javac Main.java && java Main'],
    fileExtension: 'java',
    filename: 'Main.java'
  },
  go: {
    image: 'golang:1.21-alpine',
    cmd: ['go', 'run'],
    fileExtension: 'go',
    filename: 'main.go'
  },
  rust: {
    image: 'rust:1.75-alpine',
    cmd: ['sh', '-c', 'rustc main.rs && ./main'],
    fileExtension: 'rs',
    filename: 'main.rs'
  },
  cpp: {
    image: 'gcc:12-alpine',
    cmd: ['sh', '-c', 'g++ -o main main.cpp && ./main'],
    fileExtension: 'cpp',
    filename: 'main.cpp'
  }
};

const EXECUTION_TIMEOUT = 10000; // 10 seconds
const MEMORY_LIMIT = 128 * 1024 * 1024; // 128MB

export class CodeExecutionService {
  private tempDir: string;

  constructor() {
    this.tempDir = '/tmp/code-execution';
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  async executeCode(
    code: string,
    language: ProgrammingLanguage
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = uuidv4();
    const config = LANGUAGE_CONFIGS[language];

    if (!config) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        execution_time: Date.now() - startTime
      };
    }

    try {
      // Create temporary file
      const tempFilePath = path.join(this.tempDir, `${executionId}.${config.fileExtension}`);
      await fs.writeFile(tempFilePath, code, 'utf8');

      // Pull the Docker image if it doesn't exist
      await this.ensureImage(config.image);

      // Create and run container
      const result = await this.runContainer(
        config.image,
        config.cmd,
        tempFilePath,
        config.filename || `code.${config.fileExtension}`
      );

      // Clean up
      await fs.unlink(tempFilePath).catch(() => {});

      return {
        success: result.exitCode === 0,
        output: result.exitCode === 0 ? result.stdout : undefined,
        error: result.exitCode !== 0 ? result.stderr || result.stdout : undefined,
        execution_time: Date.now() - startTime
      };
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        execution_time: Date.now() - startTime
      };
    }
  }

  private async ensureImage(imageName: string): Promise<void> {
    try {
      await docker.getImage(imageName).inspect();
    } catch (error) {
      console.log(`Pulling Docker image: ${imageName}`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err: any, stream: any) => {
          if (err) return reject(err);
          
          docker.modem.followProgress(stream, (err: any, res: any) => {
            if (err) return reject(err);
            resolve(res);
          });
        });
      });
    }
  }

  private async runContainer(
    image: string,
    cmd: string[],
    hostFilePath: string,
    containerFileName: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const containerOptions = {
      Image: image,
      Cmd: [...cmd, containerFileName],
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: MEMORY_LIMIT,
        CpuQuota: 50000, // 0.5 CPU
        CpuPeriod: 100000,
        NetworkMode: 'none', // No network access for security
        ReadonlyRootfs: false,
        Binds: [`${hostFilePath}:/workspace/${containerFileName}:ro`],
        AutoRemove: true,
      },
      AttachStdout: true,
      AttachStderr: true,
    };

    const container = await docker.createContainer(containerOptions);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error('Execution timeout'));
      }, EXECUTION_TIMEOUT);

      container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      }, (err: any, stream: any) => {
        if (err) {
          clearTimeout(timeout);
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        const chunks: Buffer[] = [];
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', async () => {
          clearTimeout(timeout);
          
          // Parse Docker stream format
          const data = Buffer.concat(chunks);
          let offset = 0;
          
          while (offset < data.length) {
            const header = data.subarray(offset, offset + 8);
            if (header.length < 8) break;
            
            const streamType = header[0];
            const size = header.readUInt32BE(4);
            const payload = data.subarray(offset + 8, offset + 8 + size);
            
            if (streamType === 1) { // stdout
              stdout += payload.toString();
            } else if (streamType === 2) { // stderr
              stderr += payload.toString();
            }
            
            offset += 8 + size;
          }

          try {
            const containerInfo = await container.inspect();
            const exitCode = containerInfo.State.ExitCode || 0;
            
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode
            });
          } catch (inspectError) {
            resolve({
              stdout: stdout.trim(),
              stderr: stderr.trim(),
              exitCode: 1
            });
          }
        });

        container.start().catch((startError: any) => {
          clearTimeout(timeout);
          reject(startError);
        });
      });
    });
  }

  async checkDockerStatus(): Promise<boolean> {
    try {
      await docker.ping();
      return true;
    } catch (error) {
      console.error('Docker is not available:', error);
      return false;
    }
  }
}