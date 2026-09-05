import Link from "next/link";
import Image from "next/image";

/**
 * ==============================================================================
 * PeerConnect Home / Landing Page (`/`)
 * ==============================================================================
 * 
 * DESIGN ARCHITECTURE:
 * - Glassmorphic Hero section with vibrant gradient typography
 * - Live product mockup preview demonstrating Feed & Chat capabilities
 * - 4 Pillars of Campus Collaboration
 * - "How It Works" 3-Step student onboarding timeline
 * - Comprehensive campus footer with platform status indicator
 */
export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-lg border border-indigo-500/30 group-hover:scale-105 transition">
              <Image
                src="/logo.png"
                alt="PeerConnect Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition">
              PeerConnect
            </span>
          </Link>

          {/* Quick Nav Anchor Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#community" className="hover:text-white transition">Community</a>
          </nav>

          {/* Auth CTAs */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 transition"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Ambient background blur circles */}
        <div className="absolute w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] -top-20 left-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Live Platform Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>University Peer Collaboration Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15] max-w-4xl">
          Where University Students <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Connect, Share & Excel
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Discover classmates across your faculty, exchange lecture slides and PDFs,
          and chat in real-time with instant Firestore cloud synchronization.
        </p>

        {/* Dual Call-To-Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-xl shadow-indigo-500/25 transition text-center text-sm"
          >
            Create Free Student Account →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-semibold transition text-center text-sm"
          >
            Sign In to Account
          </Link>
        </div>

        {/* Key Trust Signals */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>100% Student Email Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-indigo-400 font-bold">⚡</span>
            <span>Real-Time Firestore Sync</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-violet-400 font-bold">📁</span>
            <span>Cloudinary PDF & Slide Sharing</span>
          </div>
        </div>

        {/* 3. INTERACTIVE PRODUCT MOCKUP PREVIEW */}
        <div className="mt-16 w-full max-w-4xl p-2 sm:p-3 rounded-2xl bg-white/5 border border-white/15 shadow-2xl backdrop-blur-xl">
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 text-left">
            {/* Mock Window Controls */}
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono text-slate-400 ml-2">peerconnect.edu/feed</span>
            </div>

            {/* Mock Feed Card */}
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                    JD
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Jane Doe</h4>
                    <p className="text-[11px] text-indigo-300">Computing • Semester 4</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                  Study Notes
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Just uploaded our Distributed Systems mid-term revision sheet! Covers consensus algorithms, RPC, and CAP theorem. Feel free to comment or reach out if you want to study together before Friday! 🚀
              </p>
              <div className="flex items-center space-x-4 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                <span className="flex items-center space-x-1.5 text-pink-400 font-semibold">
                  <span>❤️</span> <span>24 Likes</span>
                </span>
                <span className="flex items-center space-x-1.5 text-slate-300">
                  <span>💬</span> <span>8 Comments</span>
                </span>
                <span className="flex items-center space-x-1.5 text-indigo-300">
                  <span>📎</span> <span>Lecture_Notes_v2.pdf</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOUR PILLARS OF CAMPUS COLLABORATION */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
            Built for Academic Life
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything You Need to Succeed Together
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl mb-4">
              👥
            </div>
            <h4 className="text-base font-bold text-white mb-2">Classmate Directory</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filter student peers by Faculty, Semester, or Student ID. Connect with classmates taking your exact modules.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl mb-4">
              💬
            </div>
            <h4 className="text-base font-bold text-white mb-2">Instant 1-on-1 Chat</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time messaging with live Firestore snapshots. Features unread badges and deterministic private channels.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl mb-4">
              📚
            </div>
            <h4 className="text-base font-bold text-white mb-2">Material Sharing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload past papers, revision notes, PowerPoint slides, and code snippets via high-speed Cloudinary storage.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-2xl mb-4">
              📰
            </div>
            <h4 className="text-base font-bold text-white mb-2">Interactive Feed</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcast academic questions, share project updates, comment on discussions, and react with live like counts.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">
            Simple 3-Step Process
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            How Campus Collaboration Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-lg shadow-indigo-600/30">
              1
            </div>
            <h4 className="text-base font-bold text-white mb-2">Create & Verify Account</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign up with your university email. Click the verification link sent to your inbox to activate campus access.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-lg shadow-violet-600/30">
              2
            </div>
            <h4 className="text-base font-bold text-white mb-2">Discover Classmates</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Filter the directory by faculty and semester. Send peer connection requests to form study circles.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-pink-600 text-white font-extrabold flex items-center justify-center text-sm mb-4 shadow-lg shadow-pink-600/30">
              3
            </div>
            <h4 className="text-base font-bold text-white mb-2">Collaborate in Real-Time</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Message peers directly, share study notes, ask questions on the feed, and prepare for exams together.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section id="community" className="py-16 px-4 sm:px-6 max-w-4xl mx-auto w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/60 to-slate-900/80 border border-indigo-500/30 shadow-2xl backdrop-blur-xl">
          <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Connect with Your Peers?
          </h3>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Join hundreds of university students already collaborating, sharing notes, and studying together on PeerConnect.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold shadow-xl transition hover:scale-105 text-sm"
          >
            Join PeerConnect Today — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* 7. COMPREHENSIVE CAMPUS FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-slate-950/90 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-lg border border-indigo-500/30">
                <Image
                  src="/logo.png"
                  alt="PeerConnect Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-bold text-white text-base">PeerConnect</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The modern peer collaboration and networking platform for university students.
            </p>
            <div className="inline-flex items-center space-x-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Platform</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/dashboard" className="hover:text-white transition">Dashboard</Link></li>
              <li><Link href="/feed" className="hover:text-white transition">Campus Feed</Link></li>
              <li><Link href="/peers" className="hover:text-white transition">Classmates Directory</Link></li>
              <li><Link href="/messages" className="hover:text-white transition">Real-Time Messages</Link></li>
            </ul>
          </div>

          {/* Col 3: Authentication */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Account</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white transition">Create Free Account</Link></li>
              <li><Link href="/profile/edit" className="hover:text-white transition">Edit Student Profile</Link></li>
            </ul>
          </div>

          {/* Col 4: Tech Stack */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Built With</h5>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Next.js 16 (App Router), Firebase Auth & Firestore, Cloudinary CDN, Tailwind CSS & TypeScript.
            </p>
            <a
              href="https://github.com/safith001/peer-connect-node"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
            >
              View on GitHub ↗
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PeerConnect. Built for campus peer collaboration.
        </div>
      </footer>

    </div>
  );
}

