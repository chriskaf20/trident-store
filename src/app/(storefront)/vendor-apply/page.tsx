import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VendorApplyForm } from "./VendorApplyForm";
import { CheckCircle2, Clock, XCircle, ArrowRight, Store } from "lucide-react";

export default async function VendorApplyPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated, check for an existing application
  if (user) {
    const { data: existingApp } = await supabase
      .from("vendor_applications")
      .select("id, status, store_name, created_at")
      .eq("user_id", user.id)
      .single();

    // Also check if user is already a vendor (approved and store exists)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // Already a vendor — redirect to their dashboard
    if (profile?.role === "vendor") {
      redirect("/dashboard");
    }

    // Has a pending application — show pending state
    if (existingApp?.status === "pending") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-background">
          <div className="text-center max-w-lg">
            {/* Animated clock icon */}
            <div className="relative w-28 h-28 mx-auto mb-10">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-ping opacity-60" />
              <div className="relative w-28 h-28 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-2xl shadow-amber-500/20">
                <Clock className="w-14 h-14" />
              </div>
            </div>

            <div className="inline-block bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-amber-200 dark:border-amber-900/40">
              Application Submitted
            </div>

            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
              Under Review
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg leading-relaxed">
              Your application for{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {existingApp.store_name}
              </strong>{" "}
              is currently being reviewed by our curation team. You'll receive a
              notification within{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                24–48 hours
              </strong>
              .
            </p>

            {/* Status timeline */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-10 text-left space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">
                    Application Submitted
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(existingApp.created_at).toLocaleDateString(
                      "en-GB",
                      { day: "numeric", month: "long", year: "numeric" },
                    )}
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 ml-4" />
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0 animate-pulse">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    Under Curation Review
                  </p>
                  <p className="text-xs text-slate-400">
                    Expected: within 24–48 hours
                  </p>
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 ml-4" />
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-500 text-sm">
                    Store Goes Live
                  </p>
                  <p className="text-xs text-slate-400">Pending approval</p>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
            >
              Back to Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      );
    }

    // Has a rejected application
    if (existingApp?.status === "rejected") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-screen py-32 px-6 bg-background">
          <div className="text-center max-w-lg">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-xl border-4 border-white dark:border-slate-900">
              <XCircle className="w-12 h-12" />
            </div>
            <div className="inline-block bg-red-500/10 text-red-500 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider uppercase mb-4 border border-red-200 dark:border-red-900/40">
              Application Declined
            </div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-slate-900 dark:text-white">
              Not This Time
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed">
              Unfortunately, your application for{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {existingApp.store_name}
              </strong>{" "}
              wasn't approved at this time. Our team may reach out with
              feedback. You're welcome to re-apply in the future.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity uppercase tracking-widest text-sm"
            >
              Back to Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      );
    }
  }

  // Not logged in, or no previous application — show the full apply page
  return <VendorApplyForm />;
}
