"use client";

import { signup } from '../actions'
import Link from 'next/link'
import { useActionState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, null)

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground relative overflow-hidden">

            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 blur-[128px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 blur-[128px] rounded-full pointer-events-none" />

            <Link href="/" className="relative z-10 flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-2xl shadow-xl shadow-primary/20">
                    T
                </div>
                <span className="font-bold text-3xl tracking-tight hidden sm:block text-foreground drop-shadow-sm">
                    TRIDENT
                </span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[420px] relative z-10"
            >
                <Card className="border-border/60 shadow-2xl bg-secondary/10 backdrop-blur-xl rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-3 pb-8 pt-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                        <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                        <CardDescription className="text-base text-muted-foreground font-medium">
                            Join Trident Store to start shopping or selling
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-10">
                        <form className="flex flex-col gap-6" action={formAction}>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground/90 ml-1" htmlFor="email">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="h-14 bg-background/50 border-border/60 focus:bg-background transition-colors text-base px-4 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5 mb-2">
                                <label className="text-sm font-semibold text-foreground/90 ml-1" htmlFor="password">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Must be at least 6 characters"
                                    required
                                    minLength={6}
                                    className="h-14 bg-background/50 border-border/60 focus:bg-background transition-colors text-base px-4 rounded-xl"
                                />
                            </div>

                            {state?.error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{state.error}</p>
                                </motion.div>
                            )}

                            <SubmitButton className="w-full h-14 text-base font-bold shadow-xl shadow-primary/20 rounded-xl mt-2 relative overflow-hidden group">
                                <span className="relative z-10">Sign Up</span>
                                {/* Hover shimmer effect */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer z-0" />
                            </SubmitButton>

                            <div className="text-center text-sm text-muted-foreground mt-4 font-medium">
                                Already have an account?{" "}
                                <Link href="/auth/login" className="text-primary font-bold hover:underline transition-colors drop-shadow-sm">
                                    Sign in here
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
