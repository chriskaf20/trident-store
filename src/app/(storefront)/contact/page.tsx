export default function SupportPlaceholderPage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8 text-center bg-background">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Contact Support</h1>
        <p className="text-muted-foreground">Need help? You can connect with our support agents anytime. We provide 24/7 dedicated support.</p>
        <button className="px-6 py-2 bg-amber-600 text-white rounded-full font-bold">Open Ticket</button>
      </div>
    </div>
  );
}
