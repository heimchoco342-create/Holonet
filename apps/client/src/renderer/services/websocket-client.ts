import { WebSocketMessage, WebSocketMessageType } from '@holonet/shared';

export interface WebSocketClientOptions {
  url: string;
  headers?: Record<string, string>;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: WebSocketClientOptions;
  private messages: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.options.url;
        const ws = new WebSocket(url);

        ws.onopen = () => {
          this.ws = ws;
          this.reconnectAttempts = 0;
          this.options.onOpen?.();
          resolve();
        };

        ws.onmessage = (event) => {
          const message: WebSocketMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: this.detectMessageType(event.data),
            content: this.parseMessageContent(event.data),
            timestamp: new Date(),
            direction: 'received',
          };
          this.messages.push(message);
          this.options.onMessage?.(message);
        };

        ws.onerror = (error) => {
          const err = new Error('WebSocket connection error');
          this.options.onError?.(err);
          reject(err);
        };

        ws.onclose = () => {
          this.ws = null;
          this.options.onClose?.();
          // Auto-reconnect logic can be added here if needed
        };
      } catch (error: any) {
        reject(new Error(`Failed to create WebSocket: ${error.message}`));
      }
    });
  }

  send(message: string, type: WebSocketMessageType = 'text'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const wsMessage: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: message,
      timestamp: new Date(),
      direction: 'sent',
    };

    this.messages.push(wsMessage);

    if (type === 'binary') {
      // Convert string to ArrayBuffer for binary messages
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      this.ws.send(data);
    } else {
      this.ws.send(message);
    }

    this.options.onMessage?.(wsMessage);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getMessages(): WebSocketMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
  }

  private detectMessageType(data: any): WebSocketMessageType {
    if (data instanceof ArrayBuffer || data instanceof Blob) {
      return 'binary';
    }
    try {
      JSON.parse(data);
      return 'json';
    } catch {
      return 'text';
    }
  }

  private parseMessageContent(data: any): string {
    if (data instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      return decoder.decode(data);
    }
    if (data instanceof Uint8Array) {
      // Handle Uint8Array (which TextEncoder.encode returns)
      const decoder = new TextDecoder();
      return decoder.decode(data);
    }
    if (data instanceof Blob) {
      return '[Blob data]';
    }
    return String(data);
  }
}
