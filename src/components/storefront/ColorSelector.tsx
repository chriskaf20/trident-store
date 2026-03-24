'use client'

import { cn } from '@/lib/utils'

interface Color {
    name: string
    hex: string
}

interface ColorSelectorProps {
    colors: Color[]
    selectedColor: string | null
    onSelect: (colorName: string) => void
}

export function ColorSelector({ colors, selectedColor, onSelect }: ColorSelectorProps) {
    if (!colors || colors.length === 0) return null

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold tracking-wide uppercase">
                    Color
                </span>
                {selectedColor && (
                    <span className="text-sm font-normal text-muted-foreground">— {selectedColor}</span>
                )}
            </div>
            <div className="flex flex-wrap gap-3">
                {colors.map(color => (
                    <button
                        key={color.name}
                        type="button"
                        title={color.name}
                        onClick={() => onSelect(color.name)}
                        className={cn(
                            'w-8 h-8 rounded-full border-2 transition-all duration-150 hover:scale-110',
                            selectedColor === color.name
                                ? 'border-foreground scale-110 shadow-lg ring-2 ring-foreground ring-offset-2 ring-offset-background'
                                : 'border-border hover:border-foreground'
                        )}
                        style={{ backgroundColor: color.hex }}
                    />
                ))}
            </div>
        </div>
    )
}
