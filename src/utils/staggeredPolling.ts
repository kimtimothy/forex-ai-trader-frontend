/**
 * Staggered Polling System
 * Prevents all components from making requests simultaneously
 * by staggering their polling intervals
 */

interface PollingConfig {
  component: string;
  baseInterval: number;
  staggerOffset: number; // Random offset to stagger requests
}

class StaggeredPolling {
  private static instance: StaggeredPolling;
  private componentConfigs: Map<string, PollingConfig> = new Map();
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): StaggeredPolling {
    if (!StaggeredPolling.instance) {
      StaggeredPolling.instance = new StaggeredPolling();
    }
    return StaggeredPolling.instance;
  }

  registerComponent(component: string, baseInterval: number): PollingConfig {
    // Generate a random stagger offset (0-30% of base interval)
    const staggerOffset = Math.random() * (baseInterval * 0.3);
    
    const config: PollingConfig = {
      component,
      baseInterval,
      staggerOffset
    };

    this.componentConfigs.set(component, config);
    return config;
  }

  startPolling(component: string, callback: () => void): void {
    const config = this.componentConfigs.get(component);
    if (!config) {
      console.warn(`Component ${component} not registered for staggered polling`);
      return;
    }

    // Clear existing interval if any
    this.stopPolling(component);

    // Calculate staggered interval
    const staggeredInterval = config.baseInterval + config.staggerOffset;
    
    console.log(`Starting staggered polling for ${component}: ${staggeredInterval}ms (base: ${config.baseInterval}ms + stagger: ${config.staggerOffset.toFixed(0)}ms)`);

    // Start with immediate execution, then use staggered interval
    callback();
    
    const interval = setInterval(callback, staggeredInterval);
    this.activeIntervals.set(component, interval);
  }

  stopPolling(component: string): void {
    const interval = this.activeIntervals.get(component);
    if (interval) {
      clearInterval(interval);
      this.activeIntervals.delete(component);
      console.log(`Stopped polling for ${component}`);
    }
  }

  stopAllPolling(): void {
    this.activeIntervals.forEach((interval, component) => {
      clearInterval(interval);
      console.log(`Stopped polling for ${component}`);
    });
    this.activeIntervals.clear();
  }

  getPollingStatus(): { component: string; interval: number; staggered: number }[] {
    return Array.from(this.componentConfigs.entries()).map(([component, config]) => ({
      component,
      interval: config.baseInterval,
      staggered: config.baseInterval + config.staggerOffset
    }));
  }
}

export const staggeredPolling = StaggeredPolling.getInstance();

// Predefined configurations for common components
export const POLLING_CONFIGS = {
  ACTIVE_POSITIONS: { baseInterval: 15000 }, // 15s
  ML_DASHBOARD: { baseInterval: 30000 },     // 30s
  BOT_CONTROL: { baseInterval: 30000 },      // 30s
  TRADE_HISTORY: { baseInterval: 60000 },    // 60s
  TRADING_DASHBOARD: { baseInterval: 60000 }, // 60s
  PAIR_STATS: { baseInterval: 60000 },       // 60s
};
