/**
 * Simple logger utility for consistent logging across the application
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.log(prefix, message, ...args);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.log(prefix, message, ...args);
        }
        break;
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  success(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, `✅ ${message}`, ...args);
  }

  failure(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, `❌ ${message}`, ...args);
  }
}

export const logger = new Logger();
