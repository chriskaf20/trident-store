'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
    mainImage: string
    images: string[]
    productName: string
}

export function ProductGallery({ mainImage, images, productName }: ProductGalleryProps) {
    // Build final list: primaryImage first, then any extras from images[]
    const allImages = [
        ...(mainImage ? [mainImage] : []),
        ...images.filter((img) => img && img !== mainImage),
    ]

    const [selectedIdx, setSelectedIdx] = useState(0)
    const selectedImage = allImages[selectedIdx] || mainImage

    const prev = () => setSelectedIdx((i) => (i - 1 + allImages.length) % allImages.length)
    const next = () => setSelectedIdx((i) => (i + 1) % allImages.length)

    if (allImages.length === 0) {
        return (
            <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-secondary flex items-center justify-center text-muted-foreground text-sm">
                No image available
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            {/* Thumbnail strip — only show if more than 1 image */}
            {allImages.length > 1 && (
                <div className="flex flex-col gap-2 w-16 shrink-0">
                    {allImages.map((img, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedIdx(idx)}
                            className={cn(
                                'relative w-16 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                                idx === selectedIdx
                                    ? 'border-foreground shadow-md'
                                    : 'border-border/50 hover:border-border opacity-70 hover:opacity-100'
                            )}
                        >
                            <Image
                                src={img}
                                alt={`${productName} view ${idx + 1}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main image */}
            <div className="relative aspect-[4/5] flex-1 rounded-2xl overflow-hidden bg-secondary group">
                <Image
                    src={selectedImage}
                    alt={productName}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-opacity duration-300"
                    priority
                />

                {/* Prev / Next arrows (only if multiple images) */}
                {allImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Dot indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {allImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedIdx(idx)}
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full transition-all',
                                        idx === selectedIdx
                                            ? 'bg-white w-4'
                                            : 'bg-white/60 hover:bg-white'
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
