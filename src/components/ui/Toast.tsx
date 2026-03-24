'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react'

type ToastType = 'success' | 'error' | 'cart'

interface ToastMessage {
    id: string
    type: ToastType
    message: string
}

// Global event bus for toasts
const TOAST_EVENT = 'trident:toast'

export function showToast(message: string, type: ToastType = 'success') {
    const event = new CustomEvent(TOAST_EVENT, { detail: { message, type, id: crypto.randomUUID() } })
    window.dispatchEvent(event)
}

export function ToastProvider() {
    const [toasts, setToasts] = useState<ToastMessage[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    useEffect(() => {
        const handler = (e: Event) => {
            const toast = (e as CustomEvent).detail as ToastMessage
            setToasts(prev => [...prev, toast])
            setTimeout(() => removeToast(toast.id), 3000)
        }
        window.addEventListener(TOAST_EVENT, handler)
        return () => window.removeEventListener(TOAST_EVENT, handler)
    }, [removeToast])

    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold bg-foreground text-background animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
                >
                    {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                    {toast.type === 'cart' && <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0" />}
                    {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    )
}
