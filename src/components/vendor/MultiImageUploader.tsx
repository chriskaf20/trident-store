'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, ImagePlus, GripVertical } from 'lucide-react'

interface ImageFile {
    id: string
    file: File
    previewUrl: string
}

interface MultiImageUploaderProps {
    onChange: (files: File[]) => void
    maxImages?: number
}

export function MultiImageUploader({ onChange, maxImages = 8 }: MultiImageUploaderProps) {
    const [images, setImages] = useState<ImageFile[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const addFiles = (files: FileList | null) => {
        if (!files) return
        const newImages: ImageFile[] = []
        Array.from(files).slice(0, maxImages - images.length).forEach(file => {
            if (!file.type.startsWith('image/')) return
            newImages.push({
                id: crypto.randomUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
            })
        })
        const updated = [...images, ...newImages]
        setImages(updated)
        onChange(updated.map(i => i.file))
    }

    const removeImage = (id: string) => {
        const updated = images.filter(i => i.id !== id)
        setImages(updated)
        onChange(updated.map(i => i.file))
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        addFiles(e.dataTransfer.files)
    }

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={[
                    'w-full rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200',
                    isDragging
                        ? 'border-foreground bg-secondary/30 scale-[1.01]'
                        : 'border-border hover:border-foreground/50 hover:bg-secondary/10',
                ].join(' ')}
            >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-sm">
                        {isDragging ? 'Drop images here' : 'Drag & drop images'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        or click to select · JPG, PNG, WebP · Max {maxImages} images
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={e => addFiles(e.target.files)}
                    // Pass each file as a named input for server action
                    name="images"
                />
            </div>

            {/* Preview grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                        <div key={img.id} className={[
                            'relative aspect-square rounded-xl overflow-hidden border-2 group',
                            idx === 0 ? 'border-foreground' : 'border-border',
                        ].join(' ')}>
                            <Image
                                src={img.previewUrl}
                                alt={`Image ${idx + 1}`}
                                fill
                                className="object-cover"
                            />
                            {/* Primary badge */}
                            {idx === 0 && (
                                <div className="absolute top-1 left-1 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    Primary
                                </div>
                            )}
                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            {/* Order number */}
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {idx + 1}
                            </div>
                        </div>
                    ))}
                    {/* Add more slot */}
                    {images.length < maxImages && (
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-foreground/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ImagePlus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Hidden inputs for form submission */}
            {images.map((img, idx) => (
                <input
                    key={img.id}
                    type="hidden"
                    name={idx === 0 ? 'primaryImageName' : `extraImageName_${idx}`}
                    value={img.file.name}
                />
            ))}
        </div>
    )
}
