import { createClient } from '@/lib/supabase/server'
import { toggleProductTrending } from '../../actions'

export default async function AdminProductsPage() {
    const supabase = await createClient()

    const { data: products, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (products && products.length > 0) {
        const storeIds = [...new Set(products.map((p: any) => p.store_id).filter(Boolean))];
        if (storeIds.length > 0) {
            const { data: storesData } = await supabase.from('stores').select('id, name, slug').in('id', storeIds);
            if (storesData) {
                const storeDict: Record<string, any> = {};
                storesData.forEach(s => { storeDict[s.id] = s; });
                products.forEach((p: any) => {
                    p.stores = storeDict[p.store_id] || null;
                });
            }
        }
    }

    const { count: totalCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

    const { count: inStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .gt('stock', 0)

    const { count: outOfStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('stock', 0)

    return (
        <div className="p-8 md:p-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">Products</h2>
                    <p className="text-slate-500 font-medium tracking-wide">All products listed across every vendor store.</p>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Total Products</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalCount || 0}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">In Stock</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{inStockCount || 0}</h3>
                </div>
                <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined">remove_shopping_cart</span>
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-1">Out of Stock</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{outOfStockCount || 0}</h3>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        All Products ({count || 0})
                    </h3>
                </div>
                {products && products.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Product</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Store</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Price</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">Stock</th>
                                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Trending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product: any) => (
                                <tr key={product.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <span className="material-symbols-outlined !text-[18px] text-slate-400">image</span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{product.name}</p>
                                                <p className="text-xs text-slate-400 line-clamp-1">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {(product.stores as any)?.name || '—'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full capitalize">
                                            {product.category || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                                                {Number(product.price).toLocaleString('en-US')} TL
                                            </p>
                                            {product.original_price && (
                                                <p className="text-xs text-slate-400 line-through">
                                                    {Number(product.original_price).toLocaleString('en-US')} TL
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            (product.stock || 0) > 0
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        }`}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <form action={toggleProductTrending.bind(null, product.id, !!product.is_trending)}>
                                            <button 
                                                type="submit"
                                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                                    product.is_trending ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                            >
                                                <div 
                                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                                                        product.is_trending ? 'left-7' : 'left-1'
                                                    }`}
                                                />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <span className="material-symbols-outlined !text-[48px] mb-4">inventory_2</span>
                        <p className="font-bold">No products yet</p>
                        <p className="text-sm mt-1">Products added by vendors will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
