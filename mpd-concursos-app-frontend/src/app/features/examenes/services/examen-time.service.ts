import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ExamenTimeService {
  private serverTimeDiff = 0;
  private lastSync: number = 0;
  private readonly SYNC_INTERVAL = 30000; // Sincronizar cada 30 segundos
  private isInitialized = false;
  private syncPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {
    this.syncPromise = this.syncTime();
    setInterval(() => this.syncTime(), this.SYNC_INTERVAL);
  }

  private async syncTime(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSync < this.SYNC_INTERVAL) return;

    return new Promise((resolve, reject) => {
      this.http.get<{timestamp: number}>('/api/time').subscribe({
        next: (response) => {
          const serverTime = response.timestamp;
          this.serverTimeDiff = serverTime - Date.now();
          this.lastSync = now;
          this.isInitialized = true;
          resolve();
        },
        error: (err) => {
          console.error('Error sincronizando tiempo:', err);
          reject(err);
        }
      });
    });
  }

  public async getCurrentTime(): Promise<number> {
    await this.syncPromise;
    if (!this.isInitialized) return Date.now();
    return Date.now() + this.serverTimeDiff;
  }

  public async getTimeRemaining(endTime: number): Promise<number> {
    if (!endTime) return 0;
    const currentTime = await this.getCurrentTime();
    const remaining = endTime - currentTime;
    return Math.max(0, remaining);
  }

  public async formatTimeRemaining(endTime: number): Promise<string> {
    if (!endTime || !this.isInitialized) return '--:--';
    const remaining = await this.getTimeRemaining(endTime);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
} 