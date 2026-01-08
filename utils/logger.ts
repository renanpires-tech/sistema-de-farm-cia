/**
 * Sistema de Logs para Auditoria e Debugging
 * Registra ações importantes do sistema para análise e auditoria
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
}

class Logger {
  private getUserId(): string | undefined {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.username;
      }
    } catch {
      // Ignora erros de parsing
    }
    return undefined;
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getUserId(),
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry = this.formatLog(level, message, context);
    
    // Console para desenvolvimento - Garante que sempre exibe
    const timestamp = new Date().toLocaleString('pt-BR');
    const style = 
      level === 'ERROR' ? 'color: red; font-weight: bold; background: #1a0000; padding: 2px 6px; border-radius: 3px' :
      level === 'WARN' ? 'color: orange; font-weight: bold; background: #1a1000; padding: 2px 6px; border-radius: 3px' :
      level === 'AUDIT' ? 'color: #4A90E2; font-weight: bold; background: #000a1a; padding: 2px 6px; border-radius: 3px' :
      'color: #4CAF50; font-weight: bold; background: #001a00; padding: 2px 6px; border-radius: 3px';
    
    // Sempre exibe no console, independente do contexto
    const logMessage = `[${entry.level}] ${timestamp} | ${entry.message}`;
    
    if (level === 'ERROR') {
      console.error(`%c${logMessage}`, style, context || '');
    } else if (level === 'WARN') {
      console.warn(`%c${logMessage}`, style, context || '');
    } else {
      console.log(`%c${logMessage}`, style, context || '');
    }

    // Exibe também um log estruturado para facilitar debugging
    if (context && Object.keys(context).length > 0) {
      console.log('📋 Context:', context);
    }

    // Em produção, aqui poderia enviar para um serviço de logs
    // Por exemplo: sendToLogService(entry);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }

  success(message: string, context?: Record<string, any>) {
    this.log('INFO', `✅ ${message}`, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }

  error(message: string, error?: any, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorResponse: error?.response,
    };
    this.log('ERROR', message, errorContext);
  }

  audit(action: string, entity: string, entityId?: number, details?: Record<string, any>) {
    this.log('AUDIT', `${action}: ${entity}${entityId ? ` (ID: ${entityId})` : ''}`, details);
  }
}

export const logger = new Logger();

