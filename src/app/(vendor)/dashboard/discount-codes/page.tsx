import { createClient } from '@/lib/supabase/server'
import { createDiscountCode, deleteDiscountCode } from './actions'
import { Badge } from '@/components/ui/Badge'
import { Trash2, Tag } from 'lucide-react'

export default async function DiscountCodesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase.from('stores').select('id').eq('owner_id', user?.id).single()

    let codes: any[] = []
    if (store) {
        const { data } = await supabase
            .from('discount_codes')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
        codes = data ?? []
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Discount Codes</h1>
                <p className="text-muted-foreground mt-1 text-sm">Create promotional codes your customers can use at checkout.</p>
            </div>

            {/* Create Form */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                <h2 className="text-lg font-bold mb-6">Create New Code</h2>
                <form action={createDiscountCode} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Code *</label>
                        <input
                            name="code"
                            required
                            placeholder="e.g. SUMMER20"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Discount Type</label>
                        <select
                            name="discount_type"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Discount Value *</label>
                        <input
                            name="discount_value"
                            type="number"
                            step="0.01"
                            min="1"
                            required
                            placeholder="e.g. 20 (for 20% off)"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Min Order Amount ($)</label>
                        <input
                            name="min_order_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={0}
                            placeholder="0 = no minimum"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Expiry Date (optional)</label>
                        <input
                            name="expires_at"
                            type="date"
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:bg-amber-600 transition-colors">
                            Create Code
                        </button>
                    </div>
                </form>
            </div>

            {/* Codes List */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold">Active Codes ({codes.length})</h2>
                </div>
                {codes.length === 0 ? (
                    <div className="py-16 text-center">
                        <Tag className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No discount codes yet.</p>
                        <p className="text-slate-400 text-sm">Create your first code above to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {codes.map((code) => {
                            const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                            return (
                                <div key={code.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black font-black text-sm rounded tracking-widest font-mono">
                                            {code.code}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {code.discount_type === 'percentage' ? `${code.discount_value}% off` : `$${code.discount_value} off`}
                                                {code.min_order_amount > 0 && <span className="text-slate-400 font-normal ml-2">on orders over ${code.min_order_amount}</span>}
                                            </p>
                                            {code.expires_at && (
                                                <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {isExpired ? 'Expired' : `Expires`} {new Date(code.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isExpired ? (
                                            <Badge variant="destructive">Expired</Badge>
                                        ) : code.is_active ? (
                                            <Badge variant="success">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Inactive</Badge>
                                        )}
                                        <form action={async () => {
                                            'use server'
                                            await deleteDiscountCode(code.id)
                                        }}>
                                            <button type="submit" className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
