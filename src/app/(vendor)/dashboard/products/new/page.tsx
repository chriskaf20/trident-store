'use client'

import { useActionState, useState, useRef, startTransition } from 'react'
import { createProduct } from '../../actions'
import Link from 'next/link'
import Image from 'next/image'
import { ImagePlus, X, Info, Box, Plus, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, type ProductFormValues } from '@/lib/schemas'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────
// TODO: Fetch these dynamically from the database
const CATEGORIES = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Women' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Men' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Accessories' }
]

// ─── Reusable field wrapper ───────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
    )
}

// ─── Section wrapper ──────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <span className="text-slate-400">{icon}</span>
                <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-300">{title}</h2>
            </div>
            <div className="p-6 space-y-5">{children}</div>
        </div>
    )
}

// ─── Input styles ─────────────────────────────────────────────────────────
const inputCls = "w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent text-sm transition-all"
const textareaCls = inputCls + " resize-none"

// ─── Page ─────────────────────────────────────────────────────────────────
export default function NewProductPage() {
    const [state, formAction, isPending] = useActionState(createProduct, null)
    
    const { register, control, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            description: '',
            category_id: '',
            variants: [{ name: 'Default', price: 0, stock_quantity: 0, sku: '' }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants"
    })

    // Image state
    const [imageFiles, setImageFiles] = useState<{ id: string; file: File; url: string }[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // ── Image handlers ──
    const addImageFiles = (files: FileList | null) => {
        if (!files) return
        const added: { id: string; file: File; url: string }[] = []
        Array.from(files).slice(0, 8 - imageFiles.length).forEach(f => {
            if (!f.type.startsWith('image/')) return
            added.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) })
        })
        setImageFiles(prev => [...prev, ...added])
    }
    const removeImage = (id: string) => setImageFiles(prev => prev.filter(i => i.id !== id))

    const onFormSubmit = async (data: ProductFormValues) => {
        if (imageFiles.length === 0) {
            toast.error('At least one product image is required')
            return
        }

        const formData = new FormData()
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('category_id', data.category_id)
        formData.append('variants', JSON.stringify(data.variants))

        imageFiles.forEach((img, idx) => {
            formData.append('images', img.file)
        })

        startTransition(() => {
            formAction(formData)
        })
    }

    return (
        <div className="p-6 md:p-10 max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Add New Product</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Define your product and its specific SKU variants.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onFormSubmit)} encType="multipart/form-data" className="space-y-5">

                {/* ── 1. Images ── */}
                <Section icon={<ImagePlus className="w-4 h-4" />} title="Product Images">
                    <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); addImageFiles(e.dataTransfer.files) }}
                        onClick={() => inputRef.current?.click()}
                        className={[
                            'w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
                            isDragging ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500',
                        ].join(' ')}
                    >
                        <ImagePlus className="w-7 h-7 text-slate-300" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500">
                                {isDragging ? 'Drop here!' : 'Drag & drop or click to upload'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP · up to 8 images · first = primary</p>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={e => addImageFiles(e.target.files)}
                        />
                    </div>

                    {imageFiles.length > 0 && (
                        <div className="grid grid-cols-4 gap-3 mt-3">
                            {imageFiles.map((img, idx) => (
                                <div key={img.id} className={[
                                    'relative aspect-square rounded-xl overflow-hidden border-2 group',
                                    idx === 0 ? 'border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-700',
                                ].join(' ')}>
                                    <Image src={img.url} alt="" fill className="object-cover" />
                                    {idx === 0 && <div className="absolute top-1 left-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">Primary</div>}
                                    <button type="button" onClick={e => { e.stopPropagation(); removeImage(img.id) }}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    ><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── 2. Basic Info ── */}
                <Section icon={<Info className="w-4 h-4" />} title="Base Product Info">
                    <Field label="Product Name *">
                        <input
                            {...register('name')}
                            placeholder="e.g. Classic Cotton T-Shirt"
                            className={[inputCls, errors.name ? 'border-red-500' : ''].join(' ')}
                        />
                        {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
                    </Field>

                    <Field label="Description">
                        <textarea
                            {...register('description')}
                            rows={4}
                            placeholder="Describe material, fit, styling tips, occasion..."
                            className={[textareaCls, errors.description ? 'border-red-500' : ''].join(' ')}
                        />
                        {errors.description && <p className="text-xs text-red-500 font-bold">{errors.description.message}</p>}
                    </Field>

                    <Field label="Category *">
                        <select
                            {...register('category_id')}
                            className={[inputCls, errors.category_id ? 'border-red-500' : ''].join(' ')}
                        >
                            <option value="">Select category...</option>
                            {/* In a real app, these should be dynamically fetched from the categories table */}
                            <option value="11111111-1111-1111-1111-111111111111">Apparel / Women</option>
                            <option value="22222222-2222-2222-2222-222222222222">Apparel / Men</option>
                            <option value="33333333-3333-3333-3333-333333333333">Accessories</option>
                        </select>
                        {errors.category_id && <p className="text-xs text-red-500 font-bold">{errors.category_id.message}</p>}
                    </Field>
                </Section>

                {/* ── 3. Variants (SKUs) ── */}
                <Section icon={<Box className="w-4 h-4" />} title="Variants (SKUs)">
                    <div className="space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 relative">
                                {fields.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => remove(index)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Variant Name *">
                                        <input
                                            {...register(`variants.${index}.name`)}
                                            placeholder="e.g. Red / Medium"
                                            className={inputCls}
                                        />
                                        {errors.variants?.[index]?.name && <p className="text-xs text-red-500 font-bold">{errors.variants[index].name.message}</p>}
                                    </Field>

                                    <Field label="SKU (Optional)">
                                        <input
                                            {...register(`variants.${index}.sku`)}
                                            placeholder="e.g. TSHIRT-RED-M"
                                            className={inputCls}
                                        />
                                    </Field>

                                    <Field label="Price (TL) *">
                                        <input
                                            {...register(`variants.${index}.price`)}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className={inputCls}
                                        />
                                        {errors.variants?.[index]?.price && <p className="text-xs text-red-500 font-bold">{errors.variants[index].price.message}</p>}
                                    </Field>

                                    <Field label="Stock Quantity *">
                                        <input
                                            {...register(`variants.${index}.stock_quantity`)}
                                            type="number"
                                            min="0"
                                            className={inputCls}
                                        />
                                        {errors.variants?.[index]?.stock_quantity && <p className="text-xs text-red-500 font-bold">{errors.variants[index].stock_quantity.message}</p>}
                                    </Field>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => append({ name: '', price: 0, stock_quantity: 0, sku: '' })}
                            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Add Another Variant
                        </button>
                    </div>
                </Section>


                {/* Error */}
                {state?.error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{state.error}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pb-8">
                    <Link href="/dashboard/products" className="flex-1 py-3.5 text-center border-2 border-slate-200 dark:border-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isPending || imageFiles.length === 0}
                        className="flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                    >
                        {isPending ? 'Publishing...' : 'Publish Product'}
                    </button>
                </div>
            </form>
        </div>
    )
}
