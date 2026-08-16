export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navigation */}
      <nav className="flex items-center justify-between bg-white px-8 py-5 shadow-sm">

        <h1 className="text-2xl font-bold text-blue-600">
          JASVITO
        </h1>

        <a
          href="/login"
          className="rounded-lg border border-gray-300 px-5 py-2 font-semibold hover:bg-gray-100"
        >
          Login
        </a>

      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">

        <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
          Local Skills Marketplace
        </p>

        <h2 className="max-w-3xl text-5xl font-bold leading-tight text-gray-900">
          Find the right skilled professional for your needs
        </h2>

        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          JASVITO connects customers with skilled service providers
          based on skill, location, availability and requirements.
        </p>

        {/* Two Sides */}
        <div className="mt-10 grid w-full max-w-3xl gap-6 md:grid-cols-2">

          {/* Customer Side */}
          <div className="rounded-2xl border bg-white p-8 shadow-md">

            <div className="text-4xl">
              🏠
            </div>

            <h3 className="mt-4 text-2xl font-bold text-gray-900">
              I Need a Service
            </h3>

            <p className="mt-3 text-gray-600">
              Find skilled professionals for your service requirements.
            </p>

            <a
              href="/login?type=customer"
              className="mt-6 block w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Find a Professional
            </a>

          </div>

          {/* Provider Side */}
          <div className="rounded-2xl border bg-white p-8 shadow-md">

            <div className="text-4xl">
              🛠️
            </div>

            <h3 className="mt-4 text-2xl font-bold text-gray-900">
              I Provide Services
            </h3>

            <p className="mt-3 text-gray-600">
              Connect with customers looking for your skills and services.
            </p>

            <a
              href="/login?type=provider"
              className="mt-6 block w-full rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Join as a Professional
            </a>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 text-center text-sm text-gray-500">
        © 2026 JASVITO. Connecting skills with opportunities.
      </footer>

    </main>
  );
}