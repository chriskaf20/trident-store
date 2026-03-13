"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
}

export function SubmitButton({ children, className, disabled, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
            isLoading={pending}
            className={className}
            size="lg"
            {...props}
        >
            {children}
        </Button>
    );
}

