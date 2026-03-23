import Link from "next/link";
export default function SitemapPlaceholderPage() {
  return (
    <div className="py-24 px-8 max-w-4xl mx-auto space-y-8 bg-background">
      <h1 className="text-4xl font-bold">Site Map</h1>
      <ul className="space-y-4 text-amber-600 list-disc list-inside">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/products?category=Women">Women</Link></li>
        <li><Link href="/products?category=Men">Men</Link></li>
        <li><Link href="/products?category=Accessories">Accessories</Link></li>
        <li><Link href="/about">About Us</Link></li>
        <li><Link href="/contact">Contact</Link></li>
      </ul>
    </div>
  );
}
