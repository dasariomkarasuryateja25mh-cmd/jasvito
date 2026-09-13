"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

type AccountType = "customer" | "provider";

function LoginPageContent() {
  const searchParams = useSearchParams();

  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [isSignup, setIsSignup] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [skill, setSkill] = useState("");
  const [experience, setExperience] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("error");

  useEffect(() => {
    const type = searchParams.get("type");

    if (type === "customer" || type === "provider") {
      setAccountType(type);
    } else {
      window.location.replace("/");
    }
  }, [searchParams]);

  const isProvider = accountType === "provider";

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  function validateUsername(value: string) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(value);
  }

  async function createAccount() {
    const cleanUsername = username.trim().toLowerCase();

    if (!name.trim()) {
      showMessage("Please enter your full name.", "error");
      return;
    }

    if (!validateUsername(cleanUsername)) {
      showMessage(
        "Username must be 3–30 characters and contain only letters, numbers or underscore.",
        "error"
      );
      return;
    }

    if (password.length < 6) {
      showMessage(
        "Password must contain at least 6 characters.",
        "error"
      );
      return;
    }

    if (isProvider && !skill) {
      showMessage("Please select your service.", "error");
      return;
    }

    if (
      isProvider &&
      (experience === "" ||
        Number(experience) < 0 ||
        Number(experience) > 60)
    ) {
      showMessage(
        "Please enter valid years of experience.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          password,
          name: name.trim(),
          accountType,
          skill: isProvider ? skill : "",
          experience: isProvider ? Number(experience) : 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showMessage(
          result.error || "Unable to create account.",
          "error"
        );
        setLoading(false);
        return;
      }

      showMessage(
        "Account created successfully. You can now login.",
        "success"
      );

      setPassword("");
      setLoading(false);

      setTimeout(() => {
        setIsSignup(false);
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      showMessage(
        "Unable to connect to the server. Please try again.",
        "error"
      );

      setLoading(false);
    }
  }

  async function login() {
    const cleanUsername = username.trim().toLowerCase();

    if (!validateUsername(cleanUsername)) {
      showMessage("Please enter a valid username.", "error");
      return;
    }

    if (!password) {
      showMessage("Please enter your password.", "error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      /*
       * Clear any previous session.
       * This prevents Customer → Provider or Provider → Customer
       * session crossover.
       */
      await supabase.auth.signOut();

      /*
       * Existing backend accounts still use the internal
       * @jasvito.local authentication email.
       * This is intentionally NOT changed because existing
       * accounts must continue to work.
       */
      const internalEmail = `${cleanUsername}@jasvito.local`;

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

      if (error || !data.user) {
        showMessage(
          "Username or password is incorrect.",
          "error"
        );
        setLoading(false);
        return;
      }

      const { data: account, error: accountError } =
        await supabase
          .from("user_accounts")
          .select("account_type")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (accountError || !account) {
        console.error("ACCOUNT ERROR:", accountError);

        await supabase.auth.signOut();

        showMessage(
          "Unable to load your account. Please contact support.",
          "error"
        );

        setLoading(false);
        return;
      }

      /*
       * Security check:
       * The user must actually belong to the role they selected
       * from the homepage.
       */
      if (account.account_type !== accountType) {
        await supabase.auth.signOut();

        showMessage(
          `This username belongs to a ${
            account.account_type === "provider"
              ? "Service Provider"
              : "Customer"
          } account. Please use the correct GramServe entry point.`,
          "error"
        );

        setLoading(false);
        return;
      }

      setLoading(false);

      if (accountType === "provider") {
        window.location.replace("/provider");
      } else {
        window.location.replace("/customer");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      showMessage(
        "Unable to connect to the server. Please try again.",
        "error"
      );

      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (isSignup) {
      await createAccount();
    } else {
      await login();
    }
  }

  function switchMode() {
    setIsSignup(!isSignup);
    setMessage("");
    setPassword("");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a
            href="/"
            className="text-2xl font-extrabold tracking-tight text-blue-700"
          >
            Gram<span className="text-slate-900">Serve</span>
          </a>

          <a
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-blue-700"
          >
            ← Back
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <section className="flex min-h-[calc(100vh-81px)] items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* ROLE HEADER */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              {isProvider ? "🛠️" : "👤"}
            </div>

            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              GramServe
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              {isProvider
                ? "Service Provider"
                : "Customer"}
            </h1>

            <p className="mt-2 text-slate-500">
              {isProvider
                ? "Connect with customers and grow your local service business."
                : "Find trusted local professionals for your service needs."}
            </p>
          </div>

          {/* CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">
                {isSignup
                  ? "Create your account"
                  : "Welcome back"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isSignup
                  ? `Create your ${
                      isProvider
                        ? "provider"
                        : "customer"
                    } account`
                  : "Login with your username and password"}
              </p>
            </div>

            {/* FULL NAME */}
            {isSignup && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            {/* USERNAME */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="Enter your username"
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                3–30 characters · letters, numbers and
                underscore
              </p>
            </div>

            {/* PROVIDER DETAILS */}
            {isSignup && isProvider && (
              <>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Service / Skill
                  </label>

                  <select
                    value={skill}
                    onChange={(e) =>
                      setSkill(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">
                      Select your service
                    </option>
                    <option value="Electrician">
                      Electrician
                    </option>
                    <option value="Plumber">
                      Plumber
                    </option>
                    <option value="Carpenter">
                      Carpenter
                    </option>
                    <option value="Painter">
                      Painter
                    </option>
                    <option value="Cleaner">
                      Cleaner
                    </option>
                    <option value="AC Repair">
                      AC Repair
                    </option>
                    <option value="Appliance Repair">
                      Appliance Repair
                    </option>
                    <option value="CCTV Installation">
                      CCTV Installation
                    </option>
                    <option value="Bike Mechanic">
                      Bike Mechanic
                    </option>
                    <option value="Car Mechanic">
                      Car Mechanic
                    </option>
                    <option value="Welder">
                      Welder
                    </option>
                    <option value="Mason">
                      Mason
                    </option>
                  </select>
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Years of Experience
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={experience}
                    onChange={(e) =>
                      setExperience(e.target.value)
                    }
                    placeholder="Example: 5"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            {/* PASSWORD */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete={
                  isSignup
                    ? "new-password"
                    : "current-password"
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              {isSignup && (
                <p className="mt-2 text-xs text-slate-400">
                  Minimum 6 characters
                </p>
              )}
            </div>

            {/* MESSAGE */}
            {message && (
              <div
                className={`mb-5 rounded-xl p-4 text-sm font-semibold ${
                  messageType === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-5 py-4 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? `Create ${
                    isProvider
                      ? "Provider"
                      : "Customer"
                  } Account`
                : "Login"}
            </button>

            {/* SWITCH LOGIN / SIGNUP */}
            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                {isSignup
                  ? "Already have an account?"
                  : "New to GramServe?"}

                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-2 font-bold text-blue-700 hover:underline"
                >
                  {isSignup
                    ? "Login"
                    : "Create Account"}
                </button>
              </p>
            </div>
          </div>

          {/* TRUST MESSAGE */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              🔐 Secure username & password authentication
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-700" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading GramServe...
            </p>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}