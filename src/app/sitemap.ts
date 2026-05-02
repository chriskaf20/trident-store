import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tridentstore.com'
    const supabase = await createClient()

    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1000)

    const { data: stores } = await supabase
        .from('stores')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1000)

    const productUrls = (products || []).map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
    }))

    const storeUrls = (stores || []).map((store) => ({
        url: `${baseUrl}/stores/${store.slug}`,
        lastModified: store.updated_at ? new Date(store.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }))

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/stores`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...productUrls,
        ...storeUrls,
    ]
}
