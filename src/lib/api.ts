function getApiBase(): string {
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    return "http://127.0.0.1:3001";
  }
  return "";
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}
