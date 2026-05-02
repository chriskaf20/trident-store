'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'

interface DropdownMenuProps {
    children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child) && child.type === DropdownMenuTrigger) {
                    return React.cloneElement(child as React.ReactElement<any>, { 
                        onClick: () => setIsOpen(!isOpen) 
                    })
                }
                if (React.isValidElement(child) && child.type === DropdownMenuContent) {
                    return isOpen ? child : null
                }
                return child
            })}
        </div>
    )
}

export function DropdownMenuTrigger({ children, asChild, onClick }: any) {
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<any>, { onClick })
    }
    return <button onClick={onClick}>{children}</button>
}

export function DropdownMenuContent({ children, align = 'left', className = '' }: any) {
    const alignClass = align === 'right' ? 'right-0' : 'left-0'
    return (
        <div className={`absolute ${alignClass} mt-2 w-56 origin-top-right rounded-xl bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 py-2 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-100 ${className}`}>
            {children}
        </div>
    )
}

export function DropdownMenuItem({ children, onClick, className = '' }: any) {
    return (
        <button
            className={`flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
            onClick={(e) => {
                onClick?.(e)
            }}
        >
            {children}
        </button>
    )
}
