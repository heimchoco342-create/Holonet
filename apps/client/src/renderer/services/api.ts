import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Item } from '@holonet/shared';

export interface RequestOptions {
  item: Item;
  url?: string;
  method?: string;
  headers?: Record<string, any>;
  body?: any;
  timeout?: number;
}

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private bridge?: any; // K8sBridge will be injected via IPC

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || '',
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  /**
   * Set bridge for K8s tunneling
   */
  setBridge(bridge: any) {
    this.bridge = bridge;
  }

  /**
   * Execute HTTP request
   */
  async executeRequest(options: RequestOptions): Promise<RequestResponse> {
    const startTime = Date.now();
    
    try {
      // Process through bridge if available
      let finalUrl = options.url || options.item.url || '';
      
      if (this.bridge && options.item.k8sService) {
        const bridgeResponse = await this.bridge.processRequest({
          item: options.item,
          url: finalUrl,
          method: options.method || options.item.method || 'GET',
          headers: options.headers || options.item.headers,
          body: options.body || options.item.body,
        });
        finalUrl = bridgeResponse.url;
      }

      const config: AxiosRequestConfig = {
        url: finalUrl,
        method: (options.method || options.item.method || 'GET').toLowerCase() as any,
        headers: {
          'Content-Type': 'application/json',
          ...options.item.headers,
          ...options.headers,
        },
        data: options.body || options.item.body,
        timeout: options.timeout || 30000,
      };

      const response: AxiosResponse = await this.client.request(config);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        time: Date.now() - startTime,
      };
    } catch (error: any) {
      throw {
        message: error.message || 'Request failed',
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        } : undefined,
        time: Date.now() - startTime,
      };
    }
  }

  /**
   * Replace variables in URL/headers/body
   */
  replaceVariables(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }
}
