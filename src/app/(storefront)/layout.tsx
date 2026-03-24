import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { ToastProvider } from "@/components/ui/Toast";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
            <Navbar />

            <main className="flex-1 flex flex-col">
                {children}
            </main>

            <Footer />
            <ToastProvider />
        </div>
    );
}
