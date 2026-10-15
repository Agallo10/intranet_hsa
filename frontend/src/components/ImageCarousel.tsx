import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'

export interface CarouselImage {
  id: string
  url: string
  alt?: string
}

export function ImageCarousel({ images }: { images: CarouselImage[] }) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) return null

  const current = images[Math.min(index, images.length - 1)]
  const go = (next: number) =>
    setIndex((next + images.length) % images.length)

  return (
    <div className="relative overflow-hidden rounded-lg border bg-muted">
      <img
        src={current.url}
        alt={current.alt ?? ''}
        className="mx-auto max-h-[70vh] w-full object-contain"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Imagen anterior"
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Imagen siguiente"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir a la imagen ${i + 1}`}
                className={cn(
                  'size-2 rounded-full transition-colors',
                  i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
