import axios from 'axios';
import log from 'electron-log';

export class AgentClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async sendTask(task: string, context?: any) {
    try {
      log.info(`Sending task to agent service: ${task}`);
      const response = await axios.post(`${this.baseUrl}/api/v1/agent/tasks`, {
        task,
        context
      });
      return response.data;
    } catch (error) {
      log.error('Failed to send task to agent service:', error);
      throw error;
    }
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/agent/status`);
      return response.data;
    } catch (error) {
      log.error('Failed to get agent status:', error);
      throw error;
    }
  }
}
