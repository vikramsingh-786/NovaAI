export async function fetchAPI<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (typeof errorData === 'object' && errorData !== null && 'error' in errorData) 
        ? String(errorData.error) 
        : "API request failed"
    );
  }

  return response.json() as Promise<T>;
}