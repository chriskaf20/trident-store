'use client'

import { useState } from 'react'
import { addAddress, updateAddress, deleteAddress } from '../actions'

type Address = {
    id: string
    street: string
    apartment_door?: string | null
    phone_number?: string | null
    map_location_link?: string | null
    is_default: boolean
}

function AddressForm({
    initialData,
    onCancel,
    onSuccess
}: {
    initialData?: Address | null,
    onCancel: () => void,
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        try {
            if (initialData) {
                await updateAddress(initialData.id, formData)
            } else {
                await addAddress(formData)
            }
            onSuccess()
        } catch (err: any) {
            setError(err.message || 'Failed to save address')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200 relative mb-6 text-neutral-900">
            <h3 className="font-semibold">{initialData ? 'Edit Address' : 'Add New Address'}</h3>

            {error && <div className="p-2 bg-red-50 text-red-600 rounded text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium">Street Address *</label>
                    <input required type="text" name="street" defaultValue={initialData?.street} placeholder="123 Main St" className="w-full p-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Apt / Door (Optional)</label>
                    <input type="text" name="apartment_door" defaultValue={initialData?.apartment_door || ''} placeholder="Apt 4B" className="w-full p-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium">Phone Number</label>
                    <input type="text" name="phone_number" defaultValue={initialData?.phone_number || ''} placeholder="+1 (555) 000-0000" className="w-full p-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium">Map Location Link (Optional)</label>
                    <input type="url" name="map_location_link" defaultValue={initialData?.map_location_link || ''} placeholder="https://maps.google.com/..." className="w-full p-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" id="is_default" name="is_default" defaultChecked={initialData?.is_default} className="rounded border-neutral-300 focus:ring-black" />
                    <label htmlFor="is_default" className="text-sm font-medium">Set as default address</label>
                </div>
            </div>

            <div className="flex gap-3 justify-end mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Address'}
                </button>
            </div>
        </form>
    )
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await deleteAddress(id)
        } catch (err: any) {
            alert(err.message || 'Failed to delete address')
        } finally {
            setDeletingId(null)
        }
    }

    const editingAddress = editingId ? addresses.find(a => a.id === editingId) : null

    return (
        <div className="text-neutral-900">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Shipping Addresses</h2>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-sm font-medium underline underline-offset-4 hover:text-neutral-600"
                    >
                        + Add New
                    </button>
                )}
            </div>

            {isAdding && (
                <AddressForm
                    onCancel={() => setIsAdding(false)}
                    onSuccess={() => setIsAdding(false)}
                />
            )}

            {editingAddress && (
                <AddressForm
                    initialData={editingAddress}
                    onCancel={() => setEditingId(null)}
                    onSuccess={() => setEditingId(null)}
                />
            )}

            {!isAdding && !editingId && (
                <>
                    {addresses && addresses.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {addresses.map((address) => (
                                <div key={address.id} className={`p-4 rounded-lg border flex flex-col justify-between ${address.is_default ? 'border-black bg-neutral-50/50' : 'border-neutral-200'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-medium text-sm">Delivery Location</h4>
                                            {address.is_default && (
                                                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-sm uppercase tracking-wider">Default</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-neutral-600 leading-relaxed space-y-1">
                                            <p className="font-medium text-neutral-900">{address.street}</p>
                                            {address.apartment_door && <p>Apt/Door: {address.apartment_door}</p>}
                                            {address.phone_number && <p>Phone: {address.phone_number}</p>}
                                            {address.map_location_link && (
                                                <p>
                                                    <a href={address.map_location_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                                        📍 View on Map
                                                    </a>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-4 text-sm font-medium text-neutral-500">
                                        <button
                                            onClick={() => setEditingId(address.id)}
                                            className="hover:text-black"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(address.id)}
                                            disabled={deletingId === address.id}
                                            className="hover:text-red-600 disabled:opacity-50"
                                        >
                                            {deletingId === address.id ? 'Removing...' : 'Remove'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
                            You haven't added any addresses yet.
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
