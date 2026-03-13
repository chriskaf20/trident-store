'use client'

import { useTransition } from 'react'
import { toggleWishlist } from '@/app/(storefront)/wishlist/actions'
import { Heart } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SaveToWishlistButtonProps {
    productId: string
    isSaved?: boolean
    className?: string
}

export function SaveToWishlistButton({ productId, isSaved = false, className }: SaveToWishlistButtonProps) {
    const [isPending, startTransition] = useTransition()
    const pathname = usePathname()

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleWishlist(productId, pathname)
            if (result.error) {
                // Future enhancement: show a toast notification here
                alert(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleToggle}
            data-active={isSaved}
            className={cn(
                "group p-3 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground transition-all shadow-sm flex items-center justify-center data-[active=true]:bg-rose-50 data-[active=true]:text-rose-500",
                className,
                isPending && "opacity-50 cursor-not-allowed"
            )}
            disabled={isPending}
        >
            <Heart className={cn("w-5 h-5 transition-transform group-hover:scale-110", isSaved && "fill-rose-500 text-rose-500")} />
        </button>
    )
}
