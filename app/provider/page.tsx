"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthGuard from "../components/AuthGuard";

type ServiceRequest = {
  id: string;
  provider_id: string;
  customer_name: string;
  service: string;
  location: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type ProviderProfile = {
  id: string;
  user_id: string;
  name: string;
  skill: string;
  location: string;
  experience: number;
  phone: string | null;
  service_location: string | null;
  latitude: number | null;
  longitude: number | null;
};

const services = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Cleaner",
  "AC Repair",
  "Appliance Repair",
  "CCTV Installation",
  "Bike Mechanic",
  "Car Mechanic",
  "Welder",
  "Mason",
];

export default function ProviderPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [provider, setProvider] =
    useState<ProviderProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingRequest, setUpdatingRequest] =
    useState<string | null>(null);

  const [gettingLocation, setGettingLocation] =
    useState(false);

  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [showProfile, setShowProfile] =
    useState(false);

  // -----------------------------------------
  // LOAD LOGGED-IN PROVIDER
  // -----------------------------------------

  async function loadProvider() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "PROVIDER AUTH ERROR:",
        authError
      );

      setMessage(
        "Please login before using the provider dashboard."
      );

      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from("providers")
      .select(
        "id, user_id, name, skill, location, experience, phone, service_location, latitude, longitude"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "PROVIDER LOAD ERROR:",
        error
      );

      setMessage(
        "Unable to load provider profile."
      );

      setLoading(false);
      return null;
    }

    if (!data) {
      setMessage(
        "Provider profile was not found."
      );

      setLoading(false);
      return null;
    }

    setProvider(data);

    setName(data.name || "");
    setSkill(data.skill || "");
    setLocation(data.location || "");
    setExperience(
      data.experience?.toString() || ""
    );
    setPhone(data.phone || "");

    setLatitude(data.latitude ?? null);
    setLongitude(data.longitude ?? null);

    return data;
  }

  // -----------------------------------------
  // LOAD ONLY THIS PROVIDER'S REQUESTS
  // -----------------------------------------

  async function loadRequests(
    providerId?: string
  ) {
    let currentProviderId = providerId;

    if (!currentProviderId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRequests([]);
        return;
      }

      const { data: providerData, error } =
        await supabase
          .from("providers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

      if (error || !providerData) {
        console.error(
          "PROVIDER REQUEST LOOKUP ERROR:",
          error
        );

        setRequests([]);
        return;
      }

      currentProviderId = providerData.id;
    }

    const { data, error } = await supabase
      .from("service_requests")
      .select("*")
      .eq("provider_id", currentProviderId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "REQUEST LOAD ERROR:",
        error
      );

      setMessage(
        "Unable to load service requests."
      );

      return;
    }

    setRequests(
      (data || []) as ServiceRequest[]
    );
  }

  // -----------------------------------------
  // GET GPS LOCATION
  // -----------------------------------------

  function getCurrentLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage(
        "Location services are not supported by this browser."
      );

      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setLocation(
          `GPS Location (${lat.toFixed(
            6
          )}, ${lng.toFixed(6)})`
        );

        setGettingLocation(false);

        setMessage(
          "Provider service location captured successfully! 📍"
        );
      },
      (error) => {
        console.error(
          "LOCATION ERROR:",
          error
        );

        setGettingLocation(false);

        setMessage(
          "Unable to get your location. Please allow location access."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // -----------------------------------------
  // SAVE PROVIDER PROFILE
  // -----------------------------------------

  async function saveProviderProfile() {
    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!skill.trim()) {
      setMessage("Please select your service.");
      return;
    }

    if (!location.trim()) {
      setMessage(
        "Please enter or capture your service location."
      );
      return;
    }

    if (!experience.trim()) {
      setMessage(
        "Please enter your experience."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setSaving(false);

      setMessage(
        "Please login before saving your provider profile."
      );

      return;
    }

    const providerData = {
      user_id: user.id,
      name: name.trim(),
      skill: skill.trim(),
      location: location.trim(),
      experience: Number(experience),
      phone: phone.trim(),
      service_location: location.trim(),
      latitude,
      longitude,
    };

    let error;

    if (provider?.id) {
      const result = await supabase
        .from("providers")
        .update(providerData)
        .eq("user_id", user.id);

      error = result.error;
    } else {
      const result = await supabase
        .from("providers")
        .insert([providerData]);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      console.error(
        "PROVIDER SAVE ERROR:",
        error
      );

      setMessage(
        "Unable to save provider profile."
      );

      return;
    }

    setMessage(
      "Provider profile saved successfully! ✅"
    );

    const updatedProvider =
      await loadProvider();

    if (updatedProvider) {
      await loadRequests(
        updatedProvider.id
      );
    }
  }

  // -----------------------------------------
  // ACCEPT / REJECT REQUEST
  // -----------------------------------------

  async function updateRequest(
    requestId: string,
    newStatus: "accepted" | "rejected"
  ) {
    if (updatingRequest) {
      return;
    }

    setUpdatingRequest(requestId);
    setMessage("");

    // Make sure we know which provider is logged in
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setUpdatingRequest(null);

      setMessage(
        "Your login session has expired. Please login again."
      );

      return;
    }

    const { data: providerData, error: providerError } =
      await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
      providerError ||
      !providerData
    ) {
      console.error(
        "PROVIDER UPDATE LOOKUP ERROR:",
        providerError
      );

      setUpdatingRequest(null);

      setMessage(
        "Provider account could not be verified."
      );

      return;
    }

    // Update ONLY this provider's request
    const { data, error } =
      await supabase
        .from("service_requests")
        .update({
          status: newStatus,
        })
        .eq("id", requestId)
        .eq(
          "provider_id",
          providerData.id
        )
        .select("*")
        .maybeSingle();

    if (error) {
      console.error(
        "REQUEST UPDATE ERROR:",
        error
      );

      setUpdatingRequest(null);

      setMessage(
        `Unable to ${
          newStatus === "accepted"
            ? "accept"
            : "reject"
        } the service request.`
      );

      return;
    }

    // VERY IMPORTANT:
    // If no row was returned, the database did not update anything.
    if (!data) {
      console.error(
        "REQUEST UPDATE RETURNED NO ROW"
      );

      setUpdatingRequest(null);

      setMessage(
        "The request was not updated. Please refresh the page and try again."
      );

      return;
    }

    // Update the card immediately with the
    // ACTUAL database result.
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status:
                data.status as
                  | "pending"
                  | "accepted"
                  | "rejected",
            }
          : request
      )
    );

    setUpdatingRequest(null);

    if (newStatus === "accepted") {
      setMessage(
        "Service request accepted successfully! ✅"
      );
    } else {
      setMessage(
        "Service request rejected successfully."
      );
    }

    // Reload from database to confirm
    await loadRequests(
      providerData.id
    );
  }

  // -----------------------------------------
  // INITIAL LOAD
  // -----------------------------------------

  useEffect(() => {
    async function load() {
      setLoading(true);

      const providerData =
        await loadProvider();

      if (providerData) {
        await loadRequests(
          providerData.id
        );
      }

      setLoading(false);
    }

    load();
  }, []);

  // -----------------------------------------
  // LOADING SCREEN
  // -----------------------------------------

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-gray-600">
            Loading provider dashboard...
          </p>
        </div>
      </main>
    );
  }

  // -----------------------------------------
  // PAGE
  // -----------------------------------------

  return (
    <AuthGuard allowedType="provider">
      <main className="min-h-screen bg-gray-50">

        {/* NAVIGATION */}
        <nav className="bg-white px-8 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="text-2xl font-bold text-blue-600"
            >
              JASVITO
            </a>

            <button
              type="button"
              onClick={() =>
                setShowProfile(
                  !showProfile
                )
              }
              className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100"
            >
              My Profile
            </button>
          </div>
        </nav>

        {/* PROFILE */}
        {showProfile && (
          <section className="mx-auto max-w-3xl px-6 py-10">
            <div className="rounded-2xl bg-white p-8 shadow-md">

              <div className="text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-5xl">
                  🛠️
                </div>

                <h2 className="mt-4 text-3xl font-bold text-gray-900">
                  Provider Profile
                </h2>
              </div>

              <div className="mt-8">
                <label className="font-semibold text-gray-800">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-6">
                <label className="font-semibold text-gray-800">
                  Service / Skill
                </label>

                <select
                  value={skill}
                  onChange={(e) =>
                    setSkill(e.target.value)
                  }
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4 outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select your service
                  </option>

                  {services.map(
                    (service) => (
                      <option
                        key={service}
                        value={service}
                      >
                        {service}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="mt-6">
                <label className="font-semibold text-gray-800">
                  Experience
                </label>

                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) =>
                    setExperience(
                      e.target.value
                    )
                  }
                  placeholder="Years of experience"
                  className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-6">
                <label className="font-semibold text-gray-800">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                    )
                  }
                  placeholder="9876543210"
                  className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
                />
              </div>

              <div className="mt-8 rounded-xl border bg-gray-50 p-6">
                <h3 className="text-xl font-bold text-gray-900">
                  📍 Service Location
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Customers within approximately 30 km can be matched with you.
                </p>

                <button
                  type="button"
                  onClick={
                    getCurrentLocation
                  }
                  disabled={
                    gettingLocation
                  }
                  className="mt-5 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {gettingLocation
                    ? "Getting location..."
                    : "📍 Use Current Location"}
                </button>

                {latitude !== null &&
                  longitude !== null && (
                    <div className="mt-4 rounded-lg bg-green-50 p-4">
                      <p className="font-semibold text-green-700">
                        ✓ GPS location captured
                      </p>

                      <p className="mt-1 text-sm text-green-600">
                        Latitude:{" "}
                        {latitude.toFixed(
                          6
                        )}
                      </p>

                      <p className="text-sm text-green-600">
                        Longitude:{" "}
                        {longitude.toFixed(
                          6
                        )}
                      </p>
                    </div>
                  )}

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-300" />

                  <span className="text-sm font-semibold text-gray-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-gray-300" />
                </div>

                <label className="font-semibold text-gray-800">
                  Enter Service Location Manually
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(
                      e.target.value
                    );

                    setLatitude(null);
                    setLongitude(null);
                  }}
                  placeholder="Example: Vijayawada"
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4 outline-none focus:border-blue-500"
                />
              </div>

              {message && (
                <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center font-semibold text-blue-700">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={
                  saveProviderProfile
                }
                disabled={saving}
                className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving
                  ? "Saving Profile..."
                  : "Save Provider Profile"}
              </button>
            </div>
          </section>
        )}

        {/* DASHBOARD */}
        <section className="mx-auto max-w-5xl px-6 py-12">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Provider Dashboard
          </p>

          <h2 className="mt-2 text-4xl font-bold text-gray-900">
            Service Requests
          </h2>

          <p className="mt-3 text-gray-600">
            View and manage customers looking for your services.
          </p>

          {/* PROVIDER STATUS */}
          {provider && (
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <p className="text-sm text-gray-500">
                    Your service
                  </p>

                  <h3 className="text-2xl font-bold text-gray-900">
                    {provider.name}
                  </h3>

                  <p className="font-semibold text-blue-600">
                    🛠️ {provider.skill}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Service Location
                  </p>

                  <p className="mt-1 font-semibold text-gray-800">
                    📍 {provider.location}
                  </p>

                  {provider.latitude !==
                    null &&
                    provider.longitude !==
                      null && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ GPS enabled
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* MESSAGE */}
          {message && !showProfile && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center font-semibold text-blue-700">
              {message}
            </div>
          )}

          {/* NO REQUESTS */}
          {requests.length === 0 && (
            <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-md">
              <div className="text-5xl">
                📭
              </div>

              <h3 className="mt-4 text-2xl font-bold text-gray-900">
                No service requests
              </h3>

              <p className="mt-2 text-gray-600">
                New customer requests will appear here.
              </p>
            </div>
          )}

          {/* REQUESTS */}
          {requests.length > 0 && (
            <div className="mt-10 space-y-6">

              {requests.map(
                (request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl bg-white p-6 shadow-md"
                  >

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {request.customer_name}
                        </h3>

                        <p className="mt-1 font-semibold text-blue-600">
                          🛠️ {request.service}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          request.status ===
                          "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : request.status ===
                              "accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-6 rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-500">
                        Customer Service Location
                      </p>

                      <p className="mt-1 font-semibold text-gray-800">
                        📍 {request.location}
                      </p>
                    </div>

                    {/* PENDING */}
                    {request.status ===
                      "pending" && (
                      <div className="mt-6 grid gap-4 md:grid-cols-2">

                        <button
                          type="button"
                          disabled={
                            updatingRequest ===
                            request.id
                          }
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "accepted"
                            )
                          }
                          className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingRequest ===
                          request.id
                            ? "Updating..."
                            : "✓ Accept Request"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            updatingRequest ===
                            request.id
                          }
                          onClick={() =>
                            updateRequest(
                              request.id,
                              "rejected"
                            )
                          }
                          className="rounded-lg border border-red-300 px-6 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updatingRequest ===
                          request.id
                            ? "Updating..."
                            : "✕ Reject Request"}
                        </button>

                      </div>
                    )}

                    {/* ACCEPTED */}
                    {request.status ===
                      "accepted" && (
                      <div className="mt-6 rounded-lg bg-green-50 p-4 text-center font-semibold text-green-700">
                        ✓ You accepted this service request.
                      </div>
                    )}

                    {/* REJECTED */}
                    {request.status ===
                      "rejected" && (
                      <div className="mt-6 rounded-lg bg-red-50 p-4 text-center font-semibold text-red-700">
                        ✕ This service request was rejected.
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          )}

        </section>
      </main>
    </AuthGuard>
  );
}