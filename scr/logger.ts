import fs from 'fs';
import { DEFAULT_LOG_FILE } from './config';

class Logger {
    private logFile: string;

    constructor() {
        this.logFile = DEFAULT_LOG_FILE;
    }

    private formatMessage(level: string, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        // Basic formatting for args similar to Python's %s (simplified)
        let formattedMsg = message;
        args.forEach(arg => {
            formattedMsg = formattedMsg.replace('%s', String(arg));
        });
        
        return `${timestamp} - root - ${level} - ${formattedMsg}\n`;
    }

    private write(level: string, message: string, ...args: any[]) {
        const msg = this.formatMessage(level, message, ...args);
        
        // Write to Console
        if (level === 'ERROR') console.error(msg.trim());
        else if (level === 'WARNING') console.warn(msg.trim());
        else console.log(msg.trim());

        // Write to File
        fs.appendFileSync(this.logFile, msg);
    }

    info(message: string, ...args: any[]) { this.write('INFO', message, ...args); }
    warning(message: string, ...args: any[]) { this.write('WARNING', message, ...args); }
    error(message: string, ...args: any[]) { this.write('ERROR', message, ...args); }
}

export const logger = new Logger();