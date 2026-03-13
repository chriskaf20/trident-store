import { createClient } from "@/lib/supabase/server";
import VendorApplicationCard from "./VendorApplicationCard";

export default async function AdminVendorsPage() {
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("*, profiles(email)")
    .order("created_at", { ascending: false });

  const { data: applications, error } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin vendor_applications fetch error:", error);
  }

  return (
    <div className="p-8 md:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-slate-900 dark:text-white">
            Vendors
          </h2>
          <p className="text-slate-500 font-medium tracking-wide">
            Manage stores and vendor applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-sm font-bold px-3 py-1.5 rounded-lg">
            {applications?.length || 0} Pending Applications
          </span>
        </div>
      </header>

      {/* Vendor Applications */}
      <section className="mb-10">
        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-yellow-500">
            pending_actions
          </span>
          Pending Applications
        </h3>

        {applications && applications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {applications.map((app: any) => (
              <VendorApplicationCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined !text-[48px] mb-4 text-yellow-500/40">
              pending_actions
            </span>
            <p className="font-bold">No pending applications</p>
            <p className="text-sm mt-1">
              New vendor applications will appear here.
            </p>
          </div>
        )}
      </section>

      {/* Active Stores */}
      <section>
        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            storefront
          </span>
          Active Stores ({stores?.length || 0})
        </h3>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {stores && stores.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Store
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">
                    Owner
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store: any) => (
                  <tr
                    key={store.id}
                    className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                          {store.name?.[0]?.toUpperCase() || "S"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {store.name}
                          </p>
                          <p className="text-xs text-slate-400">{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Vendor Account
                      </p>
                      <p className="text-xs text-slate-400">
                        {(store.profiles as any)?.email || ""}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {store.city || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell">
                      {new Date(store.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <span className="material-symbols-outlined !text-[48px] mb-4">
                storefront
              </span>
              <p className="font-bold">No active stores yet</p>
              <p className="text-sm mt-1">
                Approved vendor applications will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
