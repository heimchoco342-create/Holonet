import axios from 'axios';

export class RedTeamAgent {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /**
   * Starts sending HTTP requests to the target URL at the specified rate.
   * @param targetUrl The URL to attack.
   * @param rps Requests per second.
   */
  public startAttack(targetUrl: string, rps: number): void {
    if (this.intervalId) {
      console.warn('Attack already in progress. Stop it first.');
      return;
    }

    console.log(`Attacking ${targetUrl} with ${rps} rps...`);

    const intervalMs = 1000 / rps;

    this.intervalId = setInterval(async () => {
      try {
        await axios.get(targetUrl);
      } catch (error) {
        // Ignore errors during attack simulation, or log them strictly if needed
        // console.error(`Request failed: ${error}`);
      }
    }, intervalMs);
  }

  /**
   * Stops the current attack loop.
   */
  public stopAttack(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Attack stopped.');
    }
  }
}
