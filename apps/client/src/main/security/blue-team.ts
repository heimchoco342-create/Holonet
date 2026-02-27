
import { EventEmitter } from 'events';

export class BlueTeamAgent extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  /**
   * Starts monitoring the target URL for latency.
   * @param targetUrl The URL to ping.
   * @param intervalMs The interval in milliseconds between pings.
   */
  public startMonitoring(targetUrl: string, intervalMs: number): void {
    if (this.isMonitoring) {
      console.warn('Monitoring is already active.');
      return;
    }

    this.isMonitoring = true;
    console.log(`[BlueTeam] Starting monitoring on ${targetUrl} every ${intervalMs}ms...`);

    this.intervalId = setInterval(async () => {
      const start = Date.now();
      try {
        const response = await fetch(targetUrl, { method: 'HEAD' });
        const latency = Date.now() - start;

        if (latency > 500) {
          const warning = `⚠️ High Latency Detected! (${latency}ms)`;
          console.warn(warning);
          this.emit('alert', warning);
        }
      } catch (error) {
        console.error(`[BlueTeam] Ping failed for ${targetUrl}:`, error);
        this.emit('error', error);
      }
    }, intervalMs);
  }

  /**
   * Stops the monitoring loop.
   */
  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('[BlueTeam] Monitoring stopped.');
  }
}
