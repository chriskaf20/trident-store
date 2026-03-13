'use client'

import { useActionState, useState } from 'react'
import { submitReview } from '@/app/(storefront)/products/[id]/actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { Star, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
    productId: string
}

export function ReviewForm({ productId }: ReviewFormProps) {
    const [state, formAction] = useActionState(submitReview, null)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)

    if (state?.success) {
        return (
            <div className="bg-green-50 text-green-700 p-6 rounded-xl flex items-center justify-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-medium">Thank you for your review!</span>
            </div>
        )
    }

    return (
        <form action={formAction} className="bg-secondary/20 p-6 rounded-xl border border-border/50 max-w-xl">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>

            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="rating" value={rating} />

            <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Overall Rating *</p>
                <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            className="p-1 focus:outline-none"
                        >
                            <Star
                                className={cn(
                                    "w-8 h-8 transition-colors",
                                    (hoverRating || rating) >= star
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-muted-foreground/30"
                                )}
                            />
                        </button>
                    ))}
                </div>
                {rating === 0 && <p className="text-xs text-muted-foreground mt-1">Please select a rating</p>}
            </div>

            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 block" htmlFor="comment">
                    Comment (Optional)
                </label>
                <textarea
                    id="comment"
                    name="comment"
                    placeholder="What did you like or dislike about this product?"
                    className="w-full min-h-[100px] p-4 rounded-lg border border-border bg-background resize-y"
                />
            </div>

            {state?.error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md mb-4 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{state.error}</span>
                </div>
            )}

            <SubmitButton
                className="w-full sm:w-auto px-8"
                disabled={rating === 0}
            >
                Submit Review
            </SubmitButton>
        </form>
    )
}
