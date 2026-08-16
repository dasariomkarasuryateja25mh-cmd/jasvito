"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

type AccountType = "customer" | "provider";

function LoginPageContent() {
  const searchParams = useSearchParams();

  const [isSignup, setIsSignup] =
    useState(false);

  const [accountType, setAccountType] =
    useState<AccountType>("customer");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [skill, setSkill] =
    useState("");

  const [experience, setExperience] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "error"
    );

  // --------------------------------
  // CUSTOMER / PROVIDER SELECTION
  // --------------------------------

  useEffect(() => {
    const type =
      searchParams.get("type");

    if (
      type === "customer" ||
      type === "provider"
    ) {
      setAccountType(type);
      setIsSignup(true);
    }
  }, [searchParams]);

  // --------------------------------
  // MESSAGE
  // --------------------------------

  function showMessage(
    text: string,
    type: "success" | "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  // --------------------------------
  // USERNAME VALIDATION
  // --------------------------------

  function validateUsername(
    value: string
  ) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(
      value
    );
  }

  // --------------------------------
  // CREATE ACCOUNT
  // --------------------------------

  async function createAccount() {
    const cleanUsername =
      username.trim().toLowerCase();

    if (!name.trim()) {
      showMessage(
        "Please enter your full name.",
        "error"
      );
      return;
    }

    if (
      !validateUsername(
        cleanUsername
      )
    ) {
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

    if (
      accountType === "provider" &&
      !skill
    ) {
      showMessage(
        "Please select your service.",
        "error"
      );
      return;
    }

    if (
      accountType === "provider" &&
      experience === ""
    ) {
      showMessage(
        "Please enter your years of experience.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username:
                cleanUsername,

              password:
                password,

              name:
                name.trim(),

              accountType:
                accountType,

              skill:
                accountType ===
                "provider"
                  ? skill
                  : "",

              experience:
                accountType ===
                "provider"
                  ? Number(
                      experience
                    )
                  : 0,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setLoading(false);

        showMessage(
          result.error ||
            "Unable to create account.",
          "error"
        );

        return;
      }

      setLoading(false);

      showMessage(
        "Account created successfully! You can now login with your username and password. ✅",
        "success"
      );

      setPassword("");

      setTimeout(() => {
        setIsSignup(false);
        setMessage("");
      }, 1500);

    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      setLoading(false);

      showMessage(
        "Unable to connect to the server. Please try again.",
        "error"
      );
    }
  }

  // --------------------------------
  // LOGIN
  // --------------------------------

  async function login() {
    const cleanUsername =
      username.trim().toLowerCase();

    if (!cleanUsername) {
      showMessage(
        "Please enter your username.",
        "error"
      );
      return;
    }

    if (
      !validateUsername(
        cleanUsername
      )
    ) {
      showMessage(
        "Please enter a valid username.",
        "error"
      );
      return;
    }

    if (!password) {
      showMessage(
        "Please enter your password.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              username:
                cleanUsername,

              password:
                password,
            }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        setLoading(false);

        showMessage(
          result.error ||
            "Username or password is incorrect.",
          "error"
        );

        return;
      }

      if (!result.success) {
        setLoading(false);

        showMessage(
          "Login failed.",
          "error"
        );

        return;
      }

      setLoading(false);

      if (
        result.accountType ===
        "provider"
      ) {
        window.location.href =
          "/provider";
      } else {
        window.location.href =
          "/customer";
      }

    } catch (error) {
      console.error(
        "LOGIN REQUEST ERROR:",
        error
      );

      setLoading(false);

      showMessage(
        "Unable to connect to the server. Please try again.",
        "error"
      );
    }
  }

  // --------------------------------
  // SUBMIT
  // --------------------------------

  async function handleSubmit() {
    if (isSignup) {
      await createAccount();
    } else {
      await login();
    }
  }

  // --------------------------------
  // PAGE
  // --------------------------------

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVIGATION */}

      <nav className="bg-white px-8 py-5 shadow-sm">

        <div className="mx-auto max-w-5xl">

          <a
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            JASVITO
          </a>

        </div>

      </nav>

      {/* MAIN */}

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">

        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">

          {/* HEADER */}

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              JASVITO
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">

              {isSignup
                ? "Create your account"
                : "Welcome back"}

            </h1>

            <p className="mt-2 text-gray-600">

              {isSignup
                ? "Create your JASVITO account."
                : "Login using your username and password."}

            </p>

          </div>

          {/* ACCOUNT TYPE */}

          <div className="mt-8">

            <label className="font-semibold text-gray-800">
              I am a
            </label>

            <div className="mt-3 grid grid-cols-2 gap-4">

              {/* CUSTOMER */}

              <button
                type="button"
                onClick={() =>
                  setAccountType(
                    "customer"
                  )
                }
                className={`rounded-xl border p-5 ${
                  accountType ===
                  "customer"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >

                <div className="text-3xl">
                  👤
                </div>

                <p className="mt-2 font-bold">
                  Customer
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Find local professionals
                </p>

              </button>

              {/* PROVIDER */}

              <button
                type="button"
                onClick={() =>
                  setAccountType(
                    "provider"
                  )
                }
                className={`rounded-xl border p-5 ${
                  accountType ===
                  "provider"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >

                <div className="text-3xl">
                  🛠️
                </div>

                <p className="mt-2 font-bold">
                  Provider
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Offer your services
                </p>

              </button>

            </div>

          </div>

          {/* FULL NAME */}

          {isSignup && (
            <div className="mt-6">

              <label className="font-semibold text-gray-800">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Enter your full name"
                className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
              />

            </div>
          )}

          {/* USERNAME */}

          <div className="mt-6">

            <label className="font-semibold text-gray-800">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Example: provider123"
              autoComplete="username"
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              3–30 characters. Use letters, numbers or underscore.
            </p>

          </div>

          {/* PROVIDER DETAILS */}

          {isSignup &&
            accountType ===
              "provider" && (
              <>

                {/* SERVICE */}

                <div className="mt-6">

                  <label className="font-semibold text-gray-800">
                    Service / Skill
                  </label>

                  <select
                    value={skill}
                    onChange={(e) =>
                      setSkill(
                        e.target.value
                      )
                    }
                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4"
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

                {/* EXPERIENCE */}

                <div className="mt-6">

                  <label className="font-semibold text-gray-800">
                    Years of Experience
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={
                      experience
                    }
                    onChange={(e) =>
                      setExperience(
                        e.target.value
                      )
                    }
                    placeholder="Example: 5"
                    className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4"
                  />

                </div>

              </>
            )}

          {/* PASSWORD */}

          <div className="mt-6">

            <label className="font-semibold text-gray-800">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Minimum 6 characters"
              autoComplete={
                isSignup
                  ? "new-password"
                  : "current-password"
              }
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            />

          </div>

          {/* INFORMATION */}

          {isSignup && (
            <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">

              <p className="font-semibold">
                🔐 Username + Password
              </p>

              <p className="mt-1">
                No OTP or email confirmation is required.
              </p>

            </div>
          )}

          {/* MESSAGE */}

          {message && (
            <div
              className={`mt-5 rounded-lg p-4 text-center font-semibold ${
                messageType ===
                "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* BUTTON */}

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >

            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Login"}

          </button>

          {/* SWITCH */}

          <div className="mt-6 text-center">

            <span className="text-gray-600">

              {isSignup
                ? "Already have an account?"
                : "Don't have an account?"}

            </span>

            <button
              type="button"
              onClick={() => {
                setIsSignup(
                  !isSignup
                );

                setMessage("");
                setPassword("");
              }}
              className="ml-2 font-bold text-blue-600 hover:underline"
            >

              {isSignup
                ? "Login"
                : "Create Account"}

            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

// --------------------------------
// SUSPENSE WRAPPER
// --------------------------------

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">

          <p className="text-gray-600">
            Loading JASVITO...
          </p>

        </main>
      }
    >

      <LoginPageContent />

    </Suspense>
  );
}