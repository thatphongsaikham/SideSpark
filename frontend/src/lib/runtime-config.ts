const DEFAULT_LOCAL_API_URL = 'http://localhost:5000'

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return normalizeUrl(configuredUrl)
  }

  return DEFAULT_LOCAL_API_URL
}
