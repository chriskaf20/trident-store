import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";

export default async function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userProfile = null;
    if (user) {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        userProfile = profileData;
    }

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
            <Navbar initialUser={user} initialProfile={userProfile} />

            <main className="flex-1 flex flex-col">
                {children}
            </main>

            <Footer />
            <ToastProvider />
        </div>
    );
}
