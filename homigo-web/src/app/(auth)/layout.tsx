import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col">
      <header className="p-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-3xl">🏠</span>
          <span className="text-2xl font-bold text-blue-600">Homigo</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="p-4 text-center text-sm text-gray-600">
        <p>© 2025 Homigo. All rights reserved.</p>
      </footer>
    </div>
  );
}
