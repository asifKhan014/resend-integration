const normalizeUrl = (url?: string) => {
  if (!url) return undefined
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export const resolveStorefrontUrl = (configModule: any) => {
  const cors =
    configModule?.projectConfig?.http?.storeCors ||
    configModule?.projectConfig?.storeCors

  if (cors) {
    const entries = Array.isArray(cors)
      ? cors
      : (cors as string)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)

    if (entries.length) {
      return normalizeUrl(entries[0])
    }
  }

  const fromAdmin = normalizeUrl(configModule?.admin?.storefrontUrl)

  return fromAdmin || "https://storefront.com"
}
