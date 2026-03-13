'use client'

import { useState } from 'react'
import { approveVendorApplication, rejectVendorApplication } from './actions'

export default function VendorApplicationCard({ app }: { app: any }) {
    const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
    const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

    async function handleApprove() {
        setLoading('approve')
        setResult(null)
        const res = await approveVendorApplication(app.id)
        setResult(res)
        setLoading(null)
    }

    async function handleReject() {
        setLoading('reject')
        setResult(null)
        const res = await rejectVendorApplication(app.id)
        setResult(res)
        setLoading(null)
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-yellow-200 dark:border-yellow-900/40 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black text-lg">
                    {app.store_name?.[0]?.toUpperCase() || 'V'}
                </div>
                <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">Pending</span>
            </div>

            <h4 className="font-black text-slate-900 dark:text-white mb-1">{app.store_name || 'Unnamed Store'}</h4>
            <p className="text-sm text-slate-500 mb-0.5">{app.applicant_name || 'Unknown'}</p>
            <p className="text-xs text-slate-400 mb-1">{app.applicant_email || ''}</p>
            {app.city && <p className="text-xs text-slate-400 mb-1">📍 {app.city}</p>}
            {app.whatsapp && <p className="text-xs text-slate-400 mb-1">📱 {app.whatsapp}</p>}
            {app.instagram && <p className="text-xs text-slate-400 mb-4">📸 @{app.instagram}</p>}

            {app.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">{app.description}</p>
            )}

            {result?.error && (
                <p className="text-xs text-red-500 font-medium mb-3">{result.error}</p>
            )}
            {result?.success && (
                <p className="text-xs text-green-500 font-medium mb-3">Done! Page will refresh shortly.</p>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleApprove}
                    disabled={!!loading}
                    className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading === 'approve' ? 'Approving…' : 'Approve'}
                </button>
                <button
                    onClick={handleReject}
                    disabled={!!loading}
                    className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                    {loading === 'reject' ? 'Rejecting…' : 'Reject'}
                </button>
            </div>
        </div>
    )
}
