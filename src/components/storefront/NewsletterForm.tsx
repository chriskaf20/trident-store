'use client'

import { useActionState } from 'react'
import { subscribeToNewsletter } from '@/app/(storefront)/newsletter/actions'
import { Input } from '@/components/ui/Input'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function NewsletterForm() {
    const [state, formAction] = useActionState(subscribeToNewsletter, null)

    if (state?.success) {
        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{state.success}</span>
            </div>
        )
    }

    return (
        <form action={formAction} className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed mb-2 text-muted-foreground">
                Join our newsletter for exclusive drops and vendor features.
            </p>
            <div className="flex gap-2">
                <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    className="bg-background border-border/50 h-11"
                />
                <SubmitButton className="h-11 px-6 whitespace-nowrap bg-foreground text-background font-semibold rounded-md hover:bg-foreground/90 transition-colors">
                    Subscribe
                </SubmitButton>
            </div>
            {state?.error && (
                <div className="flex items-center gap-1.5 text-destructive text-sm mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{state.error}</span>
                </div>
            )}
        </form>
    )
}
