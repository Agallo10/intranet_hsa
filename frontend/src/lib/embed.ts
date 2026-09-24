export function toEmbedSrc(url: string): string | null {
  if (!url) return null

  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`

  return null
}
