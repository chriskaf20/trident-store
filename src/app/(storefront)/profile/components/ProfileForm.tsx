'use client'

import { useState } from 'react'
import { updateProfile } from '../actions'

const EMOJI_OPTIONS = ['👤', '👩‍🚀', '👨‍🚀', '🦸‍♀️', '🦸‍♂️', '🥷', '🧙‍♀️', '🦁', '🦊', '🐼', '🦄', '🐲', '😎', '👽', '👾', '🤖']

export function ProfileForm({
    initialPhoneNumber,
    initialGender,
    initialEmoji,
    email,
    role
}: {
    initialPhoneNumber: string | null,
    initialGender: string | null,
    initialEmoji: string | null,
    email: string,
    role: string
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        try {
            await updateProfile(formData)
            setIsEditing(false)
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    if (!isEditing) {
        return (
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center relative group">
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-4 right-4 text-sm font-medium text-neutral-500 hover:text-black hover:underline"
                >
                    Edit
                </button>
                <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-5xl mb-4 relative">
                    {initialEmoji || '👤'}
                </div>
                <h2 className="text-xl font-semibold mb-1">{email}</h2>
                <div className="flex items-center justify-center gap-2 mb-2 mt-1">
                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        {role}
                    </span>
                </div>
                {initialPhoneNumber && <p className="text-neutral-600 text-sm mb-1">{initialPhoneNumber}</p>}
                {initialGender && <p className="text-neutral-500 text-sm capitalize">{initialGender}</p>}
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm text-left">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Edit Profile</h3>
                <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm font-medium text-neutral-500 hover:text-black"
                >
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Avatar Emoji</label>
                    <div className="flex flex-wrap gap-2">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <label key={emoji} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="avatar_emoji"
                                    value={emoji}
                                    defaultChecked={(initialEmoji || '👤') === emoji}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-10 flex items-center justify-center text-2xl rounded-full bg-neutral-50 border border-neutral-200 peer-checked:border-black peer-checked:bg-neutral-100 hover:bg-neutral-100 transition-colors">
                                    {emoji}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="phone_number" className="text-sm font-medium">Phone Number</label>
                    <input
                        type="text"
                        name="phone_number"
                        id="phone_number"
                        defaultValue={initialPhoneNumber || ''}
                        placeholder="+1 (555) 000-0000"
                        className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="gender" className="text-sm font-medium">Gender</label>
                    <select
                        name="gender"
                        id="gender"
                        defaultValue={initialGender || ''}
                        className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    )
}
