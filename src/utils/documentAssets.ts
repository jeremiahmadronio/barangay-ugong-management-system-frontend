const assetsBaseUrl = `${import.meta.env.BASE_URL}assets/`

export const documentAssets = {
  certificateTemplate: `${assetsBaseUrl}barangay-certificate-template.pdf`,
  letterhead: `${assetsBaseUrl}barangay-letterhead-header.png`,
  seal: `${assetsBaseUrl}ugong-seal.png`,
} as const

export async function loadDocumentAsset(url: string): Promise<Uint8Array> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load document asset "${url}" (${response.status})`)
  }

  return new Uint8Array(await response.arrayBuffer())
}
