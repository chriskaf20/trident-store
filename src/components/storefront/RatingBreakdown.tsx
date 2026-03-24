import { Star } from 'lucide-react'

interface RatingBreakdownProps {
    reviews: Array<{ rating: number }>
    averageRating: number | string
    reviewCount: number
}

export function RatingBreakdown({ reviews, averageRating, reviewCount }: RatingBreakdownProps) {
    if (reviewCount === 0) return null

    const counts = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        pct: reviewCount > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviewCount) * 100) : 0,
    }))

    return (
        <div className="flex flex-col gap-1.5">
            {counts.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3 text-sm">
                    {/* Star label */}
                    <div className="flex items-center gap-1 w-8 shrink-0 text-muted-foreground text-xs">
                        <span>{star}</span>
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    </div>
                    {/* Bar */}
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    {/* Count */}
                    <span className="w-6 text-xs text-muted-foreground text-right">{count}</span>
                </div>
            ))}
        </div>
    )
}
