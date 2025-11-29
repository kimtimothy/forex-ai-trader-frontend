/**
 * Request Queue System to prevent browser connection overload
 * This prevents multiple concurrent requests from overwhelming the browser's connection limits
 */

interface QueuedRequest {
  id: string;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private maxConcurrentRequests = 3; // Limit concurrent requests
  private requestTimeout = 30000; // 30 second timeout per request
  private maxQueueSize = 10; // Maximum queue size

  async addRequest<T>(request: () => Promise<T>, requestId?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check queue size limit
      if (this.queue.length >= this.maxQueueSize) {
        console.warn(`Request queue full, rejecting request ${id}`);
        reject(new Error('Request queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest = {
        id,
        request,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(queuedRequest);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.activeRequests >= this.maxConcurrentRequests || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeRequests++;

    try {
      // Set up timeout for the request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request ${request.id} timed out after ${this.requestTimeout}ms`));
        }, this.requestTimeout);
      });

      // Race between the actual request and timeout
      const result = await Promise.race([
        request.request(),
        timeoutPromise
      ]);

      request.resolve(result);
    } catch (error) {
      console.error(`Request ${request.id} failed:`, error);
      request.reject(error);
    } finally {
      this.activeRequests--;
      // Process next request in queue
      setTimeout(() => this.processQueue(), 100); // Small delay between requests
    }
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrentRequests
    };
  }

  clearQueue() {
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// Global request queue instance
export const requestQueue = new RequestQueue();

// Utility function to wrap API calls with queuing
export const queuedRequest = <T>(request: () => Promise<T>, requestId?: string): Promise<T> => {
  return requestQueue.addRequest(request, requestId);
};
