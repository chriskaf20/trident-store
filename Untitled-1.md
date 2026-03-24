# Architectural & Security Audit Report: Trident Store

This audit provides a structured analysis of the Trident Store codebase, focusing on critical security gaps, architectural flaws, and technical debt. All findings are prioritized from most to least severe.

---

## 1. CRITICAL SECURITY & AUTHENTICATION GAPS

### 1.1. [CRITICAL] Incorrect Server-Side Supabase Client
-   **File Path**: `src/lib/supabase/server.ts`
-   **Root Cause**: The server-side Supabase client is initialized with the public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) instead of a privileged service role key. This limits all server-side operations (in Server Components, Server Actions, and Route Handlers) to the same permissions as a non-privileged, client-side user. This can lead to unexpected behavior and data access issues, and it prevents administrators from performing privileged operations.
-   **Required Action**: **EDIT** the `server.ts` client to use the `SUPABASE_SERVICE_ROLE_KEY`. This key must be set in your environment variables and must NOT be prefixed with `NEXT_PUBLIC_`. You should also create a separate admin client for operations requiring elevated privileges.

    **Recommendation for `src/lib/supabase/server.ts` (for user-context operations):**
    ```typescript
    // src/lib/supabase/server.ts
    // This client is for operations based on the logged-in user's permissions.
    import { createServerClient, type CookieOptions } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export function createClient() { // Renamed from createClient to createUserClient for clarity
        const cookieStore = cookies()
        // ... (rest of the function remains the same)
        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { ... } }
        )
    }
    ```

    **Recommendation for a new `src/lib/supabase/admin.ts` (for privileged operations):**
    ```typescript
    // src/lib/supabase/admin.ts
    // This client has admin privileges and bypasses RLS. Use with extreme care.
    import { createClient } from '@supabase/supabase-js'

    // IMPORTANT: Make sure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local
    // and is NOT prefixed with NEXT_PUBLIC_
    export const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    ```

### 1.2. [HIGH] Missing Role Verification in Server Actions
-   **File Path**: `src/app/(vendor)/dashboard/actions.ts` (and others)
-   **Root Cause**: Server Actions check for user *authentication* (`if (!user)`), but not for user *authorization*. Any logged-in user, regardless of their role (e.g., a 'customer'), could potentially call a vendor-specific or admin-specific action if the middleware protection fails or is misconfigured. This violates the principle of defense-in-depth.
-   **Required Action**: **EDIT** all sensitive Server Actions to include role verification checks at the beginning of the function.

    **Recommendation for `src/app/(vendor)/dashboard/actions.ts`:**
    ```typescript
    // At the beginning of a vendor-only server action
    import { createClient } from '@/lib/supabase/server';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    // Check if the user is a vendor OR an admin
    if (profile?.role !== 'vendor' && profile?.role !== 'admin') {
        return { error: 'Forbidden: You do not have permission to perform this action.' };
    }

    // ... rest of the action logic
    ```

### 1.3. [MEDIUM] Flawed Middleware Authorization Logic
-   **File Path**: `src/lib/supabase/middleware.ts`
-   **Root Cause**: The middleware logic incorrectly blocks admins from accessing the vendor dashboard. The check `if (pathname.startsWith('/dashboard') && userRole !== 'vendor')` redirects any non-vendor user, including an admin, to the `/vendor-apply` page.
-   **Required Action**: **EDIT** the middleware to allow users with the `admin` role to access vendor-protected routes.

    **Recommendation for `src/lib/supabase/middleware.ts`:**
    ```typescript
    // ... inside updateSession function after fetching userRole
    
    // Admin guard
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // Vendor guard (allow admins to pass)
    if (pathname.startsWith('/dashboard') && userRole !== 'vendor' && userRole !== 'admin') {
        url.pathname = '/vendor-apply';
        return NextResponse.redirect(url);
    }
    ```

---

## 2. ARCHITECTURAL FLAWS & PERFORMANCE BOTTLENECKS

### 2.1. [CRITICAL] Data Fetching Waterfall (N+1 Queries)
-   **File Paths**: `src/app/page.tsx`, `src/app/(storefront)/products/page.tsx`
-   **Root Cause**: Multiple pages fetch a list of products and then make a second, separate database call to fetch the store names for those products. This is a classic N+1 query problem that dramatically increases page load times. The logic is also duplicated across files.
-   **Required Action**: **EDIT** the database queries to use a `JOIN` operation to fetch products and their store names in a single call. This can be achieved by modifying the Supabase query or by creating a database view.

    **Recommendation:**
    1.  Create a database view for products with store names.
        ```sql
        -- In a new Supabase migration
        CREATE VIEW products_with_store_names AS
        SELECT
            p.*,
            s.name as store_name
        FROM
            products p
        LEFT JOIN
            stores s ON p.store_id = s.id;
        ```
    2.  Query the view instead of the table.
        ```typescript
        // In page.tsx files
        let query = supabase.from('products_with_store_names').select('*');
        // Now product.store_name is available directly without a second query.
        ```

### 2.2. [HIGH] Missing Product Detail Page
-   **File Path**: `src/app/(storefront)/products/[slug]/`
-   **Root Cause**: The product list page links to product detail pages (e.g., `/products/some-product-id`), but the corresponding page file to handle this route does not exist. The `[slug]` directory is empty.
-   **Required Action**: **ADD** a new page file `src/app/(storefront)/products/[slug]/page.tsx` to fetch and render individual product details.

    **Recommendation for `src/app/(storefront)/products/[slug]/page.tsx`:**
    ```typescript
    import { createClient } from '@/lib/supabase/server';
    import { notFound } from 'next/navigation';

    export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
        const supabase = await createClient();
        const { data: product } = await supabase
            .from('products_with_store_names') // Use the view from the previous point
            .select('*')
            .eq('id', params.slug) // Or 'slug' if you use a text slug
            .single();

        if (!product) {
            notFound();
        }

        return (
            <div>
                <h1>{product.name}</h1>
                <p>Sold by: {product.store_name}</p>
                {/* ... more product details */}
            </div>
        );
    }
    ```

### 2.3. [MEDIUM] Sequential `await` in Server Action
-   **File Path**: `src/app/(vendor)/dashboard/actions.ts`
-   **Root Cause**: In the `createProduct` action, multiple images are uploaded one by one in a `for` loop with `await` inside. This blocks the loop for each upload, slowing down the form submission significantly.
-   **Required Action**: **EDIT** the code to upload all extra images in parallel using `Promise.all`.

    **Recommendation for `createProduct` action:**
    ```typescript
    // ... inside createProduct action

    // ── Extra images (optional, up to 7 more) ────────────────────────────
    const extraFiles = formData.getAll('images') as File[];
    const uploadPromises = extraFiles
        .filter(file => file && file.size > 0)
        .map(file => uploadImage(file));

    const extraUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    // ... rest of the function
    ```

---

## 3. TECHNICAL DEBT & FILE CLEANUP

### 3.1. [HIGH] Unconventional Middleware Naming and Location
-   **File Path**: `src/proxy.ts`
-   **Root Cause**: The main middleware entry point is named `proxy.ts` and is located in the `src/` directory. The standard Next.js convention is to name this file `middleware.ts`. This makes the code harder to understand and maintain for developers familiar with the framework.
-   **Required Action**: **EDIT** (Rename) the file from `src/proxy.ts` to `src/middleware.ts`. No code changes are needed within the file itself.

### 3.2. [MEDIUM] Backup and Test Files in Source Directory
-   **File Paths**: 
    - `src/app/page.tsx.backup`
    - `src/components/storefront/home/AnimatedSections.tsx.backup`
    - `scripts/tests/*`
-   **Root Cause**: The codebase contains backup files (`.backup`) and a directory of one-off test scripts. These files are not part of the production application, add clutter, and can confuse developers. The test scripts indicate a lack of a proper seeding or testing strategy.
-   **Required Action**: **REMOVE** the `.backup` files immediately. **MOVE** or **REMOVE** the scripts in `scripts/tests/`. If they are needed for development, they should be moved to a separate, clearly marked `internal/` directory and documented.

### 3.3. [LOW] Duplicated Data-Fetching Logic
-   **File Paths**: `src/app/page.tsx`, `src/app/(storefront)/products/page.tsx`
-   **Root Cause**: The logic for fetching store names for a list of products is copied and pasted in at least two different files. This violates the DRY (Don't Repeat Yourself) principle and makes the code harder to maintain.
-   **Required Action**: **EDIT** the code to abstract this logic into a reusable function in a utility file (e.g., `src/lib/utils.ts`). *Note: This is resolved by implementing the view suggested in point 2.1, which is the superior solution.*

---

## 4. MISSING CONNECTIVE TISSUE (ADD)

### 4.1. [CRITICAL] No Rate Limiting
-   **File Path**: N/A (App-wide)
-   **Root Cause**: The application lacks any form of rate limiting on server actions or API routes. This exposes the application to denial-of-service (DoS) attacks, brute-force login attempts, and resource exhaustion (e.g., spamming the `createProduct` action).
-   **Required Action**: **ADD** rate limiting to sensitive endpoints. This can be done in `src/middleware.ts` for route-based protection or at the beginning of individual Server Actions.

    **Recommendation (using `rate-limiter-flexible`):**
    ```typescript
    // In a new file, e.g., `src/lib/rate-limiter.ts`
    import { RateLimiterMemory } from 'rate-limiter-flexible';

    export const limiter = new RateLimiterMemory({
        points: 10, // 10 requests
        duration: 1, // per 1 second by IP
    });

    // In a server action
    import { limiter } from '@/lib/rate-limiter';
    import { headers } from 'next/headers';

    const ip = headers().get('x-forwarded-for') || '127.0.0.1';
    try {
        await limiter.consume(ip);
    } catch (error) {
        return { error: 'Too many requests.' };
    }
    // ... rest of the action
    ```

### 4.2. [HIGH] No Global Error Reporting
-   **File Path**: N/A (App-wide)
-   **Root Cause**: There is no integration with a third-party error monitoring service (like Sentry, LogRocket, or Datadog). Without this, unhandled exceptions on the client or server will go unnoticed, making it impossible to proactively identify and fix bugs affecting users in production.
-   **Required Action**: **ADD** an error reporting service. Sentry is a popular choice with good Next.js integration. This involves wrapping layout files and instrumenting the server to catch exceptions.

### 4.3. [HIGH] No Payment Webhook Handlers
-   **File Path**: N/A (App-wide)
-   **Root Cause**: The application has a checkout flow but lacks the backend infrastructure to handle asynchronous payment confirmations via webhooks from payment providers (e.g., Stripe). This means orders cannot be reliably confirmed if the user closes their browser after paying but before being redirected.
-   **Required Action**: **ADD** a new API route (e.g., `src/app/api/webhooks/stripe/route.ts`) to securely receive and process webhooks. This route must validate the webhook signature and update the order status in the database accordingly.
