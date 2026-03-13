'use client'

import { useCartStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { placeOfflineOrder } from './actions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Image from 'next/image'
import { MapPin, Truck } from 'lucide-react'
import { PromoCodeForm } from '@/components/storefront/PromoCodeForm'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const { items, cartTotal, cartFinalTotal, discount, clearCart } = useCartStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Profile address state
    const [profileAddress, setProfileAddress] = useState<any>(null)
    const [useProfileAddress, setUseProfileAddress] = useState(false)

    // Form field state (for pre-fill from profile)
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [address, setAddress] = useState('')
    const [apartmentNumber, setApartmentNumber] = useState('')
    const [mapLink, setMapLink] = useState('')

    useEffect(() => {
        setMounted(true)
        if (items.length === 0 && mounted) {
            router.push('/')
        }

        // Fetch user profile & saved address
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone, avatar_url')
                .eq('id', user.id)
                .single()

            const { data: addr } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (profile || addr) {
                const nameParts = (profile?.full_name || '').trim().split(' ')
                setProfileAddress({
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    address: addr?.street_address || '',
                    apartmentNumber: addr?.apartment_number || '',
                    mapLink: addr?.map_link || '',
                })
            }
        }

        fetchProfile()
    }, [items, mounted, router])

    // When user toggles "use profile address", pre-fill the fields
    const handleToggleProfileAddress = (checked: boolean) => {
        setUseProfileAddress(checked)
        if (checked && profileAddress) {
            setFirstName(profileAddress.firstName)
            setLastName(profileAddress.lastName)
            setAddress(profileAddress.address)
            setApartmentNumber(profileAddress.apartmentNumber)
            setMapLink(profileAddress.mapLink)
        } else {
            setFirstName('')
            setLastName('')
            setAddress('')
            setApartmentNumber('')
            setMapLink('')
        }
    }

    if (!mounted || items.length === 0) return null

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        try {
            await placeOfflineOrder(formData, items, cartTotal(), discount?.code)
            clearCart()
        } catch (err) {
            console.error(err)
            setIsSubmitting(false)
            alert('Something went wrong placing the order. Please try again or contact support.')
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 animate-fade-in w-full">
            <h1 className="text-4xl font-bold tracking-tight mb-12">Secure Checkout</h1>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                {/* Left Col - Forms */}
                <form action={handleSubmit} className="flex-1 space-y-12">

                    {/* Contact & Delivery Method */}
                    <Card className="border-border/50 shadow-md">
                        <CardHeader className="border-b border-border/50 pb-4 mb-6">
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-muted-foreground" />
                                Contact & Delivery
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="relative border border-border/60 hover:border-primary p-4 rounded-xl cursor-pointer transition-all hover:bg-secondary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 group">
                                    <input type="radio" name="deliveryMethod" value="pickup" defaultChecked className="absolute top-4 right-4 w-4 h-4 accent-primary" />
                                    <div className="font-bold mb-1 group-has-[:checked]:text-primary">In-Store Pickup</div>
                                    <div className="text-sm text-muted-foreground">Collect directly from the boutique</div>
                                </label>
                                <label className="relative border border-border/60 hover:border-primary p-4 rounded-xl cursor-pointer transition-all hover:bg-secondary/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 group">
                                    <input type="radio" name="deliveryMethod" value="cod" className="absolute top-4 right-4 w-4 h-4 accent-primary" />
                                    <div className="font-bold mb-1 group-has-[:checked]:text-primary">Cash on Delivery</div>
                                    <div className="text-sm text-muted-foreground">Pay with cash when your package arrives</div>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Address */}
                    <Card className="border-border/50 shadow-md">
                        <CardHeader className="border-b border-border/50 pb-4 mb-2">
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                Billing & Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-4">

                            {/* Use profile address toggle */}
                            {profileAddress && (
                                <label className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={useProfileAddress}
                                        onChange={e => handleToggleProfileAddress(e.target.checked)}
                                        className="w-5 h-5 accent-primary rounded"
                                    />
                                    <div>
                                        <p className="font-bold text-sm text-primary">Use my saved address</p>
                                        {profileAddress.address && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{profileAddress.address}</p>
                                        )}
                                    </div>
                                </label>
                            )}

                            {useProfileAddress ? (
                                /* Hidden inputs carry the saved address values on submit */
                                <>
                                    <input type="hidden" name="firstName" value={firstName} />
                                    <input type="hidden" name="lastName" value={lastName} />
                                    <input type="hidden" name="address" value={address} />
                                    <input type="hidden" name="apartmentNumber" value={apartmentNumber} />
                                    <input type="hidden" name="mapLink" value={mapLink} />

                                    {/* Read-only summary of the saved address */}
                                    <div className="p-4 rounded-xl bg-secondary/40 border border-primary/20 space-y-1 text-sm">
                                        <p className="font-semibold">{firstName} {lastName}</p>
                                        {address && <p className="text-muted-foreground">{address}{apartmentNumber ? `, ${apartmentNumber}` : ''}</p>}
                                        {mapLink && (
                                            <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> View on map
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Input
                                            type="text"
                                            name="firstName"
                                            placeholder="First Name"
                                            required
                                            value={firstName}
                                            onChange={e => setFirstName(e.target.value)}
                                        />
                                        <Input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last Name"
                                            required
                                            value={lastName}
                                            onChange={e => setLastName(e.target.value)}
                                        />
                                    </div>

                                    <Input
                                        type="text"
                                        name="address"
                                        placeholder="Address / Apartment Name"
                                        required
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                    />
                                    <Input
                                        type="text"
                                        name="apartmentNumber"
                                        placeholder="Door Number (optional)"
                                        value={apartmentNumber}
                                        onChange={e => setApartmentNumber(e.target.value)}
                                    />

                                    {/* Map Location Link (optional) */}
                                    <div className="space-y-1.5">
                                        <Input
                                            type="url"
                                            name="mapLink"
                                            placeholder="Google Maps / Location Link (optional)"
                                            value={mapLink}
                                            onChange={e => setMapLink(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground pl-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Paste a Google Maps or any map link to help the driver find your location.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        className="w-full h-16 text-lg tracking-wide rounded-xl shadow-xl"
                    >
                        COMPLETE ORDER
                    </Button>
                </form>

                {/* Right Col - Review Summary */}
                <div className="w-full lg:w-[450px]">
                    <div className="sticky top-32 p-8 rounded-2xl bg-secondary/30 border border-border/50">
                        <h3 className="font-bold text-xl mb-6 flex items-center justify-between">
                            Order Summary
                            <span className="text-sm font-medium text-muted-foreground px-2 py-1 bg-background rounded-full border border-border">
                                {items.length} items
                            </span>
                        </h3>

                        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 bg-background rounded-xl border border-border overflow-hidden">
                                    <div className="w-16 h-16 rounded-md bg-secondary shrink-0 relative overflow-hidden">
                                        <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                                        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-bl-md">
                                            {item.quantity}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <span className="text-sm font-bold line-clamp-1">{item.name}</span>
                                        <span className="text-xs text-muted-foreground">{item.vendorName}</span>
                                        <span className="text-sm font-semibold mt-1">{item.price.toLocaleString()} TL</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-semibold text-foreground">{cartTotal().toLocaleString()} TL</span>
                            </div>
                            {discount && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount ({discount.code})</span>
                                    <span>-{discount.savings.toLocaleString()} TL</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span className="font-semibold text-foreground">Calculated at next step</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span className="font-semibold text-foreground">0 TL</span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <PromoCodeForm />
                        </div>

                        <div className="border-t border-border/60 pt-6 flex justify-between items-end">
                            <span className="font-bold text-lg">Total</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold">{cartFinalTotal().toLocaleString()} TL</span>
                                <p className="text-xs text-muted-foreground mt-1">Including VAT</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
