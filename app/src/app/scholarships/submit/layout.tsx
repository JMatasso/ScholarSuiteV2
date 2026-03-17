export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A5F] text-white font-bold text-sm">S</div>
          <span className="text-lg font-semibold text-[#1E3A5F]">ScholarSuite</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        {children}
      </main>
    </div>
  )
}
