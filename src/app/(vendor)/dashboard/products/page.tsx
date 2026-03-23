import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'

export default async function VendorProductsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user?.id)
        .limit(1)
        .maybeSingle()

    let products = null
    if (store) {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
        products = data
    }

    return (
        <div className="p-8 md:p-12 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Products</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage your store catalog and inventory</p>
                </div>
                <Link href="/dashboard/products/new">
                    <Button className="flex items-center gap-2 shadow-md">
                        <Plus className="w-4 h-4" /> Add Product
                    </Button>
                </Link>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border/50 bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="p-5 font-medium">Product</th>
                                    <th className="p-5 font-medium">Price</th>
                                    <th className="p-5 font-medium">Stock</th>
                                    <th className="p-5 font-medium">Status</th>
                                    <th className="p-5 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {(!products || products.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="p-4 rounded-full bg-secondary/50">
                                                    <Package className="w-8 h-8 text-muted-foreground/50" />
                                                </div>
                                                <p>No products yet. Add your first product to start selling.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product: any) => (
                                        <tr key={product.id} className="hover:bg-secondary/10 transition-colors group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-secondary rounded-xl overflow-hidden shrink-0 border border-border/50">
                                                        {product.image ? (
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                                No img
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm line-clamp-1">{product.name}</div>
                                                        <div className="text-xs text-muted-foreground mt-px">{product.category || 'Uncategorized'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 font-medium text-sm">
                                                {Number(product.price).toLocaleString('en-US')} TL
                                            </td>
                                            <td className="p-5">
                                                <span className="text-sm font-medium">{product.stock ?? 0}</span>
                                            </td>
                                            <td className="p-5">
                                                {(product.stock ?? 0) > 0 ? (
                                                    <Badge variant="success">Active</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Out of Stock</Badge>
                                                )}
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link href={`/dashboard/products/${product.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <form action={async () => {
                                                        "use server"
                                                        const { deleteProduct } = await import('../actions')
                                                        await deleteProduct(product.id)
                                                    }}>
                                                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
