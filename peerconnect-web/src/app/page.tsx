import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-indigo-500/30">
            <Image
              src="/logo.png"
              alt="PeerConnect Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">PeerConnect</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>⚡ Next.js + Firebase Real-time Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The Social Network for <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Campus Collaboration
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
          Connect with university peers, share academic updates, discover study partners,
          and chat in real-time with instant Firestore synchronization.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-xl shadow-indigo-500/25 transition cursor-pointer text-center"
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 font-semibold transition cursor-pointer text-center"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-white">Instant 1-on-1 Chat</h3>
            <p className="text-slate-400 text-sm mt-1">
              Real-time messaging powered by Cloud Firestore snapshot streams without page reloads.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold text-white">Peer Network</h3>
            <p className="text-slate-400 text-sm mt-1">
              Send and receive peer requests organized by semester, faculty, and academic majors.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">📰</div>
            <h3 className="text-lg font-semibold text-white">Interactive Feed</h3>
            <p className="text-slate-400 text-sm mt-1">
              Publish posts, comment on discussions, and react with live like counters.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-white/10 text-center text-xs text-slate-500">
        PeerConnect Modern Full-Stack Edition &bull; Next.js 16 + Firebase + TypeScript
      </footer>
    </div>
  );
}
