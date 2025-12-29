import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Performance tracking
const trackAPICall = (method: string, url: string, duration: number, success: boolean) => {
  // Store in localStorage for persistence across page reloads
  const existingMetrics = JSON.parse(localStorage.getItem('apiMetrics') || '[]');
  const metric = {
    method,
    url,
    duration,
    success,
    timestamp: Date.now()
  };
  
  existingMetrics.push(metric);
  
  // Keep only last 100 metrics
  if (existingMetrics.length > 100) {
    existingMetrics.splice(0, existingMetrics.length - 100);
  }
  
  localStorage.setItem('apiMetrics', JSON.stringify(existingMetrics));
  
  // Log slow calls
  if (duration > 1000) {
    console.warn(`🐌 Slow API call: ${method} ${url} - ${duration}ms`);
  }
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const startTime = performance.now();
  let success = false;

  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    success = true;
    return res;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    trackAPICall(method, url, duration, success);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
