import { z } from 'zod'

/**
 * Product Variant Schema
 * Each product can have multiple variants (SKUs)
 */
export const variantSchema = z.object({
    name: z.string().min(1, 'Variant name is required'), // e.g. "Red / XL"
    sku: z.string().optional(),
    price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
    stock_quantity: z.coerce.number().int().min(0, 'Stock cannot be negative'),
})

/**
 * Base Product Schema
 */
export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
    category_id: z.string().uuid('Invalid category ID'),
    status: z.enum(['draft', 'active', 'archived']).default('active'),
    is_featured: z.boolean().optional(),
    variants: z.array(variantSchema).min(1, 'At least one variant is required'),
})

export type ProductFormValues = z.infer<typeof productSchema>
export type VariantValues = z.infer<typeof variantSchema>