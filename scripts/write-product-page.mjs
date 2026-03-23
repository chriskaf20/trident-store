import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const dir = join(process.cwd(), 'src', 'app', '(storefront)', 'products', '[id]')
mkdirSync(dir, { recursive: true })

const actionsContent = `'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be logged in to leave a review.' }
    const productId = formData.get('productId') as string
    const rating = parseInt(formData.get('rating') as string)
    const comment = formData.get('comment') as string
    if (!productId || !rating || isNaN(rating) || rating < 1 || rating > 5) {
        return { error: 'Invalid review data.' }
    }
    const { data: existingReview } = await supabase
        .from('reviews').select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()
    if (existingReview) return { error: 'You have already reviewed this product.' }
    const { error: insertError } = await supabase
        .from('reviews')
        .insert([{ product_id: productId, user_id: user.id, rating, comment: comment || null }])
    if (insertError) return { error: 'Failed to submit review.' }
    revalidatePath(\`/products/\${productId}\`)
    return { success: true }
}
`

const pageContent = `import Image from "next/image";
import { Star, Truck, ArrowLeft, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { SaveToWishlistButton } from "@/components/storefront/SaveToWishlistButton";
import { ProductActionButtons } from "@/components/storefront/ProductActionButtons";
import { ReviewForm } from "@/components/storefront/ReviewForm";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const unwrappedParams = await params
    const supabase = await createClient()

    const { data: dbProduct } = await supabase
        .from('products')
        .select('*, stores!products_store_id_fkey(name, id)')
        .eq('id', unwrappedParams.id)
        .single()

    if (!dbProduct) {
        notFound()
    }

    const product = {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price,
        originalPrice: dbProduct.original_price || null,
        description: dbProduct.description || '',
        image: dbProduct.image || '',
        vendorId: dbProduct.store_id,
        vendorName: (dbProduct.stores as any)?.name || 'Unknown Store',
        stock: dbProduct.stock || 0,
    }

    const { data: { user } } = await supabase.auth.getUser()

    let isSaved = false
    if (user) {
        const { data } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', product.id)
            .single()
        if (data) isSaved = true
    }

    const { data: reviews } = await supabase
        .from('reviews')
        .select('*, profiles(first_name, last_name)')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })

    const reviewCount = reviews?.length || 0
    const averageRating = reviewCount > 0
        ? (reviews!.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount).toFixed(1)
        : 0

    const hasReviewed = user ? reviews?.some(r => r.user_id === user.id) : false

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
            <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8 group transition-colors"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Products
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 mb-24">
                <div className="flex flex-col gap-4">
                    <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-secondary">
                        {product.image ? (
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                No image available
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="mb-2">
                        <Link
                            href={"/stores/" + product.vendorId}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline"
                        >
                            {product.vendorName}
                        </Link>
                    </div>

                    <div className="flex items-start justify-between gap-4 mb-4">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            {product.name}
                        </h1>
                        <SaveToWishlistButton productId={product.id} isSaved={isSaved} />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-1 bg-secondary px-2.5 py-1 rounded-full text-sm font-medium">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            {averageRating || 'New'}
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                        {product.stock > 0 ? (
                            <Badge variant="success">In Stock</Badge>
                        ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="text-3xl font-bold">
                            {Number(product.price).toLocaleString('en-US')} TL
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                            <div className="text-lg text-muted-foreground line-through">
                                {Number(product.originalPrice).toLocaleString('en-US')} TL
                            </div>
                        )}
                        {product.originalPrice && product.originalPrice > product.price && (
                            <Badge variant="destructive">Sale</Badge>
                        )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed mb-8">
                        {product.description}
                    </p>

                    <hr className="border-border/50 mb-8" />

                    <ProductActionButtons product={product} />

                    <div className="bg-secondary/30 rounded-xl p-6 flex flex-col gap-4 border border-border/50 mt-8">
                        <div className="flex gap-4">
                            <Truck className="w-6 h-6 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="font-semibold text-sm">Flexible Delivery</h4>
                                <p className="text-sm text-muted-foreground">Cash on delivery and in-store pickup available.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <ShieldCheck className="w-6 h-6 text-muted-foreground shrink-0" />
                            <div>
                                <h4 className="font-semibold text-sm">Verified Vendor</h4>
                                <p className="text-sm text-muted-foreground">This product is sold by a vetted local creator.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-border/50 pt-16 mt-16">
                <h2 className="text-3xl font-bold tracking-tight mb-8">Customer Reviews</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1">
                        <div className="mb-8">
                            <div className="flex items-end gap-3 mb-2">
                                <span className="text-5xl font-bold">{averageRating || '0'}</span>
                                <span className="text-lg text-muted-foreground mb-1">out of 5</span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={"w-5 h-5 " + (star <= Number(averageRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30')}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">Based on {reviewCount} reviews</p>
                        </div>
                        {user ? (
                            !hasReviewed ? (
                                <ReviewForm productId={product.id} />
                            ) : (
                                <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                                    <p className="font-medium">You have already reviewed this product.</p>
                                    <p className="text-sm text-muted-foreground mt-1">Thank you for your feedback!</p>
                                </div>
                            )
                        ) : (
                            <div className="bg-secondary/30 p-6 rounded-xl border border-border/50">
                                <p className="font-medium">Want to share your thoughts?</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">Please log in to write a review.</p>
                                <Link href="/auth/login">
                                    <Badge variant="outline" className="px-4 py-2 hover:bg-foreground hover:text-background cursor-pointer">
                                        Log In
                                    </Badge>
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {!reviews || reviews.length === 0 ? (
                            <p className="text-muted-foreground italic">No reviews yet. Be the first to review this product!</p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="border-b border-border/50 pb-6 last:border-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={"w-4 h-4 " + (star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30')}
                                            />
                                        ))}
                                    </div>
                                    {review.comment && (
                                        <p className="text-foreground leading-relaxed mb-4">{review.comment}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-foreground">
                                                {(review.profiles as any)?.first_name
                                                    ? (review.profiles as any).first_name + ' ' + ((review.profiles as any).last_name || '')
                                                    : 'Anonymous Customer'}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
`

writeFileSync(join(dir, 'actions.ts'), actionsContent, 'utf8')
writeFileSync(join(dir, 'page.tsx'), pageContent, 'utf8')

console.log('Files written successfully')
console.log('actions.ts size:', actionsContent.length, 'bytes')
console.log('page.tsx size:', pageContent.length, 'bytes')
