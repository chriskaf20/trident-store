import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileForm } from './components/ProfileForm'
import { AddressManager } from './components/AddressManager'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })

    const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*, product:products(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const isVendor = profile?.role === 'vendor'
    const isAdmin = profile?.role === 'admin'

    return (
        <div className="min-h-screen bg-neutral-50 pt-24 pb-12 text-neutral-900">
            <div className="max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <ProfileForm
                        initialPhoneNumber={profile?.phone_number || null}
                        initialGender={profile?.gender || null}
                        initialEmoji={profile?.avatar_emoji || null}
                        email={user.email || ''}
                        role={profile?.role || 'customer'}
                    />

                    {isVendor && (
                        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm text-center">
                            <h3 className="font-semibold mb-2">Vendor Tools</h3>
                            <Link href="/dashboard" className="w-full block py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                                Access Vendor Portal
                            </Link>
                        </div>
                    )}

                    {isAdmin && (
                        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm text-center">
                            <h3 className="font-semibold mb-2">Admin Tools</h3>
                            <Link href="/admin" className="w-full block py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                                Access Admin Dashboard
                            </Link>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-8">
                    <div className="bg-white p-6 md:p-8 rounded-xl border border-neutral-200 shadow-sm">
                        <AddressManager addresses={addresses || []} />
                    </div>

                    {/* Order History */}
                    <div className="bg-white p-6 md:p-8 rounded-xl border border-neutral-200 shadow-sm">
                        <h2 className="text-2xl font-bold mb-6">Order History</h2>

                        {orders && orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="border border-neutral-200 rounded-lg p-5">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-neutral-100 gap-4">
                                            <div>
                                                <p className="text-sm text-neutral-500">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                <p className="text-sm font-medium mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex flex-col sm:items-end gap-1">
                                                <span className="inline-block px-3 py-1 bg-neutral-100 text-xs font-medium rounded-full capitalize">
                                                    {order.status}
                                                </span>
                                                <span className="font-semibold">
                                                    {Number(order.total_amount || 0).toLocaleString('en-US')} TL
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            {order.order_items?.map((item: any) => (
                                                <div key={item.id} className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 bg-neutral-100 rounded flex-shrink-0 overflow-hidden">
                                                        {item.product?.image && (
                                                            <img
                                                                src={item.product.image}
                                                                alt={item.product.name}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium line-clamp-1">{item.product?.name || 'Unknown Product'}</p>
                                                        <p className="text-xs text-neutral-500">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                        {Number(item.price || 0).toLocaleString('en-US')} TL
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
                                You have not placed any orders yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
