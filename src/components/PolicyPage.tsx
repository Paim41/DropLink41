import Link from "next/link";

export function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="droplink-shell min-h-screen px-6 py-10 text-[#24151A]">
      <div className="glass-card mx-auto max-w-3xl">
        <div className="border-b border-[#F62440]/15 p-6">
          <Link href="/" className="text-sm font-semibold tracking-wide text-[#F62440] hover:text-[#24151A]">DropLink</Link>
          <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-[#7B5F60]">Temporary file sharing with Telegram storage support</p>
        </div>
        <div className="space-y-5 p-6 text-sm leading-7 text-[#7B5F60]">{children}</div>
      </div>
    </main>
  );
}
