export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/" className="text-2xl font-extrabold tracking-tight">
            Gram<span className="text-blue-400">Serve</span>
          </a>

          <a
            href="/login?type=customer"
            className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10"
          >
            Login
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -right-32 top-40 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Your local service marketplace
            </div>

            <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Skilled people.
              <br />
              <span className="text-blue-400">Right when you need them.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              GramServe connects customers with trusted local
              professionals for everyday services — simply, quickly
              and close to home.
            </p>
          </div>

          {/* TWO ENTRY OPTIONS */}
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
            {/* CUSTOMER */}
            <a
              href="/login?type=customer"
              className="group rounded-3xl border border-white/10 bg-white p-7 text-slate-900 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-blue-400 sm:p-9"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                  👤
                </div>

                <span className="text-2xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
                  →
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-extrabold">
                I Need a Service
              </h2>

              <p className="mt-3 max-w-sm leading-6 text-slate-500">
                Find a trusted professional for plumbing, electrical,
                repairs, cleaning, mechanics and more.
              </p>

              <div className="mt-7 inline-flex rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white transition group-hover:bg-blue-800">
                Find a Professional
              </div>
            </a>

            {/* PROVIDER */}
            <a
              href="/login?type=provider"
              className="group rounded-3xl border border-white/10 bg-slate-800 p-7 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-blue-400 sm:p-9"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl">
                  🛠️
                </div>

                <span className="text-2xl text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400">
                  →
                </span>
              </div>

              <h2 className="mt-7 text-2xl font-extrabold">
                I Provide Services
              </h2>

              <p className="mt-3 max-w-sm leading-6 text-slate-300">
                Showcase your skills, connect with nearby customers
                and grow your local service business.
              </p>

              <div className="mt-7 inline-flex rounded-xl bg-white px-6 py-3.5 font-bold text-slate-900 transition group-hover:bg-blue-50">
                Join as a Professional
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-white/10 bg-white py-20 text-slate-900">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Simple by design
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              How GramServe works
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              From finding the right professional to completing the
              service, everything happens in one place.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {[
              {
                number: "01",
                icon: "📍",
                title: "Choose a Service",
                text: "Tell us what service you need and where you need it.",
              },
              {
                number: "02",
                icon: "🔎",
                title: "Find a Professional",
                text: "Discover suitable professionals based on service and location.",
              },
              {
                number: "03",
                icon: "🤝",
                title: "Connect",
                text: "Send a request and connect directly with the professional.",
              },
              {
                number: "04",
                icon: "⭐",
                title: "Complete & Rate",
                text: "Get the job done, connect by phone and share your rating.",
              },
            ].map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-black text-slate-300">
                    {item.number}
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-extrabold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="bg-slate-100 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 px-5 text-center sm:grid-cols-3 sm:px-8">
          <div>
            <div className="text-3xl">📍</div>
            <h3 className="mt-2 font-bold">Local First</h3>
            <p className="mt-1 text-sm text-slate-500">
              Find services close to you.
            </p>
          </div>

          <div>
            <div className="text-3xl">🔐</div>
            <h3 className="mt-2 font-bold">Simple & Secure</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your account stays protected.
            </p>
          </div>

          <div>
            <div className="text-3xl">⭐</div>
            <h3 className="mt-2 font-bold">Build Trust</h3>
            <p className="mt-1 text-sm text-slate-500">
              Ratings help build better connections.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-slate-950 py-8 text-center">
        <p className="text-lg font-extrabold">
          Gram<span className="text-blue-400">Serve</span>
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Connecting local skills with local needs.
        </p>

        <p className="mt-5 text-xs text-slate-600">
          © 2026 GramServe. All rights reserved.
        </p>
      </footer>
    </main>
  );
}