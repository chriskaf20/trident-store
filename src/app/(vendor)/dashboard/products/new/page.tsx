'use client'

import { useActionState, useState, useRef } from 'react'
import { createProduct } from '../../actions'
import Link from 'next/link'
import Image from 'next/image'
import {
    ImagePlus, X, ChevronDown, Info, Tag, Ruler,
    Palette, Package, Truck, Search
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────
const CATEGORIES = ['Women', 'Men', 'Accessories', 'Kids', 'Sport', 'Casual']
const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size']
const PRESET_COLORS = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#1E3A5F' },
    { name: 'Red', hex: '#E53E3E' },
    { name: 'Green', hex: '#276749' },
    { name: 'Blue', hex: '#3182CE' },
    { name: 'Yellow', hex: '#ECC94B' },
    { name: 'Pink', hex: '#FBB6CE' },
    { name: 'Beige', hex: '#F5F0E8' },
    { name: 'Grey', hex: '#718096' },
    { name: 'Brown', hex: '#7B3F00' },
    { name: 'Purple', hex: '#6B46C1' },
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

    // Image state
    const [imageFiles, setImageFiles] = useState<{ id: string; file: File; url: string }[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Variant state
    const [selectedSizes, setSelectedSizes] = useState<string[]>([])
    const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([])

    // Category state
    const [category, setCategory] = useState('')

    // Tag state
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState('')

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

    // ── Size handlers ──
    const toggleSize = (s: string) =>
        setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

    // ── Color handlers ──
    const toggleColor = (c: { name: string; hex: string }) =>
        setSelectedColors(prev =>
            prev.find(x => x.name === c.name) ? prev.filter(x => x.name !== c.name) : [...prev, c]
        )

    // ── Tag handlers ──
    const addTag = () => {
        const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
        if (t && !tags.includes(t) && tags.length < 10) {
            setTags(prev => [...prev, t])
            setTagInput('')
        }
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
                    <p className="text-slate-500 text-sm mt-0.5">Fill in the details to list a new product.</p>
                </div>
            </div>

            <form action={formAction} encType="multipart/form-data" className="space-y-5">

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

                    {/* Hidden file inputs for server action */}
                    {imageFiles.map((img, idx) => (
                        <input key={img.id} type="file" name={idx === 0 ? 'image' : 'images'} className="hidden"
                            ref={el => {
                                if (el) {
                                    const dt = new DataTransfer()
                                    dt.items.add(img.file)
                                    el.files = dt.files
                                }
                            }}
                        />
                    ))}
                </Section>

                {/* ── 2. Basic Info ── */}
                <Section icon={<Info className="w-4 h-4" />} title="Basic Info">
                    <Field label="Product Name *">
                        <input
                            name="name" required
                            placeholder="e.g. Silk Minimalist Gown"
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Short Description" hint="Shown below the price — 1–2 punchy sentences.">
                        <input name="short_description" placeholder="e.g. Effortlessly elegant, made from 100% silk." className={inputCls} />
                    </Field>

                    <Field label="Full Description">
                        <textarea name="description" rows={4} placeholder="Describe material, fit, styling tips, occasion..." className={textareaCls} />
                    </Field>

                    <Field label="Category">
                        <select name="category" className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>

                    {/* Tags */}
                    <Field label="Tags" hint="Up to 10 tags for search and discovery.">
                        <div className="flex gap-2">
                            <input
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                                placeholder="e.g. summer, floral..."
                                className={inputCls}
                            />
                            <button type="button" onClick={addTag} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold transition-opacity hover:opacity-80">Add</button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map(t => (
                                    <span key={t} className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full font-medium">
                                        #{t}
                                        <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Hidden input for tags */}
                        <input type="hidden" name="tags" value={JSON.stringify(tags)} />
                    </Field>
                </Section>

                {/* ── 3. Pricing ── */}
                <Section icon={<Tag className="w-4 h-4" />} title="Pricing & Stock">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Price (TL) *">
                            <input name="price" type="number" step="0.01" min="0" required placeholder="e.g. 499" className={inputCls} />
                        </Field>
                        <Field label="Original Price (TL)" hint="Set higher to show sale badge.">
                            <input name="original_price" type="number" step="0.01" min="0" placeholder="e.g. 899" className={inputCls} />
                        </Field>
                    </div>
                    <Field label="Stock Quantity">
                        <input name="stock" type="number" min="0" defaultValue={1} className={inputCls} />
                    </Field>
                </Section>

                {/* ── 4. Variants ── */}
                <Section icon={<Ruler className="w-4 h-4" />} title="Sizes & Colors">
                    <Field label="Available Sizes" hint="Click to toggle available sizes.">
                        <div className="flex flex-wrap gap-2">
                            {PRESET_SIZES.map(s => (
                                <button
                                    key={s} type="button"
                                    onClick={() => toggleSize(s)}
                                    className={[
                                        'min-w-[3rem] px-3 py-2 rounded-xl border text-sm font-semibold transition-all',
                                        selectedSizes.includes(s)
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400',
                                    ].join(' ')}
                                >{s}</button>
                            ))}
                        </div>
                        <input type="hidden" name="sizes" value={JSON.stringify(selectedSizes)} />
                    </Field>

                    <Field label="Available Colors">
                        <div className="flex flex-wrap gap-3">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.name} type="button" title={c.name}
                                    onClick={() => toggleColor(c)}
                                    className={[
                                        'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                                        selectedColors.find(x => x.name === c.name)
                                            ? 'border-slate-900 dark:border-white scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-950'
                                            : 'border-slate-300 dark:border-slate-600',
                                    ].join(' ')}
                                    style={{ backgroundColor: c.hex }}
                                />
                            ))}
                        </div>
                        <input type="hidden" name="colors" value={JSON.stringify(selectedColors)} />
                    </Field>
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
