'use client'

import { useState } from 'react'
import { Ruler } from 'lucide-react'
import { cn } from '@/lib/utils'

const SIZE_GUIDE: Record<string, { chest: string; waist: string; hips: string }> = {
    XS: { chest: '80–84', waist: '62–66', hips: '86–90' },
    S:  { chest: '84–88', waist: '66–70', hips: '90–94' },
    M:  { chest: '88–92', waist: '70–74', hips: '94–98' },
    L:  { chest: '92–96', waist: '74–78', hips: '98–102' },
    XL: { chest: '96–100', waist: '78–82', hips: '102–106' },
    XXL:{ chest: '100–104', waist: '82–86', hips: '106–110' },
}

interface SizeSelectorProps {
    sizes: string[]           // available sizes e.g. ['S','M','L']
    selectedSize: string | null
    onSelect: (size: string) => void
    outOfStock?: boolean
}

export function SizeSelector({ sizes, selectedSize, onSelect, outOfStock }: SizeSelectorProps) {
    const [showGuide, setShowGuide] = useState(false)

    if (!sizes || sizes.length === 0) return null

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold tracking-wide uppercase">
                    Size
                    {selectedSize && (
                        <span className="normal-case font-normal text-muted-foreground ml-2">
                            — {selectedSize}
                        </span>
                    )}
                </span>
                <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                    <Ruler className="w-3.5 h-3.5" />
                    Size Guide
                </button>
            </div>

            {/* Size buttons */}
            <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                    <button
                        key={size}
                        type="button"
                        onClick={() => onSelect(size)}
                        disabled={outOfStock}
                        className={cn(
                            'min-w-[3rem] px-3 py-2 rounded-xl border text-sm font-semibold transition-all duration-150',
                            selectedSize === size
                                ? 'bg-foreground text-background border-foreground shadow-md scale-105'
                                : 'border-border text-foreground hover:border-foreground bg-background hover:scale-105',
                            outOfStock && 'opacity-40 cursor-not-allowed line-through'
                        )}
                    >
                        {size}
                    </button>
                ))}
            </div>

            {/* Inline size guide table */}
            {showGuide && (
                <div className="mt-4 rounded-xl border border-border overflow-hidden text-sm">
                    <div className="bg-secondary/30 px-4 py-2 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Size Guide (cm)
                    </div>
                    <table className="w-full text-center">
                        <thead>
                            <tr className="border-b border-border text-xs text-muted-foreground">
                                <th className="py-2 px-3 text-left">Size</th>
                                <th className="py-2 px-3">Chest</th>
                                <th className="py-2 px-3">Waist</th>
                                <th className="py-2 px-3">Hips</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sizes.filter(s => SIZE_GUIDE[s]).length > 0
                                ? sizes.filter(s => SIZE_GUIDE[s])
                                : Object.keys(SIZE_GUIDE)
                            ).map(size => (
                                <tr key={size} className={cn(
                                    'border-b border-border/50 last:border-0',
                                    selectedSize === size && 'bg-secondary/40 font-semibold'
                                )}>
                                    <td className="py-2 px-3 text-left font-semibold">{size}</td>
                                    <td className="py-2 px-3">{SIZE_GUIDE[size]?.chest ?? '—'}</td>
                                    <td className="py-2 px-3">{SIZE_GUIDE[size]?.waist ?? '—'}</td>
                                    <td className="py-2 px-3">{SIZE_GUIDE[size]?.hips ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
