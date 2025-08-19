/**
 * External Service Health Checker
 * Tests connectivity to external services and provides fallback handling
 */

export interface ServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'unknown';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

export class ExternalServiceChecker {
  private static instance: ExternalServiceChecker;
  private serviceCache: Map<string, ServiceStatus> = new Map();
  private checkInterval: number = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ExternalServiceChecker {
    if (!ExternalServiceChecker.instance) {
      ExternalServiceChecker.instance = new ExternalServiceChecker();
    }
    return ExternalServiceChecker.instance;
  }

  async checkService(name: string, url: string, timeout: number = 10000): Promise<ServiceStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // Handle CORS issues for external services
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const status: ServiceStatus = {
        name,
        url,
        status: 'online',
        responseTime,
        lastChecked: new Date()
      };
      
      this.serviceCache.set(name, status);
      return status;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status: ServiceStatus = {
        name,
        url,
        status: 'offline',
        responseTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.serviceCache.set(name, status);
      return status;
    }
  }

  async checkAllServices(): Promise<ServiceStatus[]> {
    const services = [
      { name: 'Adobe PDF Viewer', url: 'https://acrobatservices.adobe.com/view-sdk/viewer.js' },
      { name: 'RingCentral API', url: 'https://platform.ringcentral.com' },
      { name: 'Supabase Storage', url: `https://gshxxsniwytjgcnthyfq.supabase.co/storage/v1/object/public` }
    ];

    const results = await Promise.allSettled(
      services.map(service => this.checkService(service.name, service.url))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: services[index].name,
          url: services[index].url,
          status: 'offline' as const,
          lastChecked: new Date(),
          error: 'Failed to check service'
        };
      }
    });
  }

  getCachedStatus(serviceName: string): ServiceStatus | null {
    return this.serviceCache.get(serviceName) || null;
  }

  getAllCachedStatuses(): ServiceStatus[] {
    return Array.from(this.serviceCache.values());
  }

  // Start periodic health checks
  startMonitoring(): void {
    setInterval(() => {
      this.checkAllServices().catch(console.error);
    }, this.checkInterval);
  }
}

// Utility functions for components
export const isServiceOnline = (serviceName: string): boolean => {
  const checker = ExternalServiceChecker.getInstance();
  const status = checker.getCachedStatus(serviceName);
  return status?.status === 'online';
};

export const getServiceStatus = (serviceName: string): ServiceStatus | null => {
  const checker = ExternalServiceChecker.getInstance();
  return checker.getCachedStatus(serviceName);
};