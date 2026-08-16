"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthGuard from "../components/AuthGuard";

type Provider = {
  id: string;
  name: string;
  skill: string;
  location: string;
  experience: number;
  phone?: string | null;
  profile_photo?: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number;
  average_rating: number;
  review_count: number;
};

type CustomerProfile = {
  name: string;
  phone: string | null;
  home_location: string | null;
  home_latitude: number | null;
  home_longitude: number | null;
  office_location: string | null;
  office_latitude: number | null;
  office_longitude: number | null;
};

type ServiceRequest = {
  id: string;
  provider_id: string;
  customer_name: string;
  service: string;
  location: string;
  status: string;
  created_at: string;
};

type LocationType = "home" | "office";

const services = [
  { name: "Electrician", icon: "⚡" },
  { name: "Plumber", icon: "🔧" },
  { name: "Carpenter", icon: "🪚" },
  { name: "Painter", icon: "🎨" },
  { name: "Cleaner", icon: "🧹" },
  { name: "AC Repair", icon: "❄️" },
  { name: "Appliance Repair", icon: "🔌" },
  { name: "CCTV Installation", icon: "📷" },
  { name: "Bike Mechanic", icon: "🏍️" },
  { name: "Car Mechanic", icon: "🚗" },
  { name: "Welder", icon: "🔩" },
  { name: "Mason", icon: "🏗️" },
];

export default function CustomerPage() {
  const [skill, setSkill] = useState("");

  const [providers, setProviders] = useState<Provider[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedProvider, setSelectedProvider] =
    useState<Provider | null>(null);

  const [customerName, setCustomerName] =
    useState("");

  const [locationType, setLocationType] =
    useState<LocationType>("home");

  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);

  const [currentRequest, setCurrentRequest] =
    useState<ServiceRequest | null>(null);

  const [requestProvider, setRequestProvider] =
    useState<Provider | null>(null);

  const [checkingStatus, setCheckingStatus] =
    useState(false);

  const [showServices, setShowServices] =
    useState(false);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const [ratingSubmitted, setRatingSubmitted] =
    useState(false);

  const [submittingRating, setSubmittingRating] =
    useState(false);

  async function loadCustomerProfile() {
    const { data, error } = await supabase
      .from("customer_profiles")
      .select(
        `
        name,
        phone,
        home_location,
        home_latitude,
        home_longitude,
        office_location,
        office_latitude,
        office_longitude
        `
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "CUSTOMER PROFILE ERROR:",
        JSON.stringify(error, null, 2)
      );
      return;
    }

    if (data) {
      setCustomerProfile(data);
      setCustomerName(data.name || "");

      if (
        data.home_location &&
        data.home_latitude !== null &&
        data.home_longitude !== null
      ) {
        setLocationType("home");
      } else if (
        data.office_location &&
        data.office_latitude !== null &&
        data.office_longitude !== null
      ) {
        setLocationType("office");
      }
    }
  }

  useEffect(() => {
    loadCustomerProfile();
  }, []);

  function getSelectedLocation() {
    if (!customerProfile) {
      return null;
    }

    if (locationType === "home") {
      if (
        customerProfile.home_location &&
        customerProfile.home_latitude !== null &&
        customerProfile.home_longitude !== null
      ) {
        return {
          address: customerProfile.home_location,
          latitude: customerProfile.home_latitude,
          longitude: customerProfile.home_longitude,
        };
      }
    }

    if (locationType === "office") {
      if (
        customerProfile.office_location &&
        customerProfile.office_latitude !== null &&
        customerProfile.office_longitude !== null
      ) {
        return {
          address: customerProfile.office_location,
          latitude: customerProfile.office_latitude,
          longitude: customerProfile.office_longitude,
        };
      }
    }

    return null;
  }

  function chooseLocation(type: LocationType) {
    setLocationType(type);
    setMessage("");
    setProviders([]);
  }

  async function addRatingsToProviders(
    providerList: any[]
  ) {
    const providersWithRatings =
      await Promise.all(
        providerList.map(async (provider) => {
          const { data, error } = await supabase
            .from("ratings")
            .select("rating")
            .eq("provider_id", provider.id);

          if (error) {
            console.error(
              "RATING LOAD ERROR:",
              JSON.stringify(error, null, 2)
            );

            return {
              ...provider,
              average_rating: 0,
              review_count: 0,
            };
          }

          const ratings = data || [];

          const reviewCount = ratings.length;

          const averageRating =
            reviewCount > 0
              ? ratings.reduce(
                  (
                    total: number,
                    item: { rating: number }
                  ) =>
                    total + Number(item.rating),
                  0
                ) / reviewCount
              : 0;

          return {
            ...provider,
            average_rating: averageRating,
            review_count: reviewCount,
          };
        })
      );

    return providersWithRatings;
  }

  async function findProfessionals() {
    if (!skill.trim()) {
      setMessage("Please select a service.");
      return;
    }

    const selectedLocation =
      getSelectedLocation();

    if (!selectedLocation) {
      setMessage(
        `Please add your ${
          locationType === "home"
            ? "Home"
            : "Office"
        } location with GPS coordinates in your profile.`
      );

      return;
    }

    setLoading(true);
    setMessage("");
    setProviders([]);

    const { data, error } = await supabase.rpc(
      "find_nearby_providers",
      {
        customer_lat:
          selectedLocation.latitude,
        customer_lng:
          selectedLocation.longitude,
        required_skill: skill,
        max_distance_km: 30,
      }
    );

    if (error) {
      console.error(
        "NEARBY PROVIDER ERROR:",
        JSON.stringify(error, null, 2)
      );

      setLoading(false);

      setMessage(
        "Unable to find nearby professionals. Please try again."
      );

      return;
    }

    if (!data || data.length === 0) {
      setLoading(false);

      setMessage(
        `No ${skill} professionals were found within 30 km.`
      );

      return;
    }

    const providersWithRatings =
      await addRatingsToProviders(data);

    setProviders(providersWithRatings);

    setLoading(false);

    setMessage(
      `${providersWithRatings.length} professional${
        providersWithRatings.length === 1
          ? ""
          : "s"
      } found within 30 km.`
    );
  }

  async function requestService() {
    if (!selectedProvider) {
      setMessage("Please select a professional first.");
      return;
    }

    const selectedLocation = getSelectedLocation();

    if (!selectedLocation) {
      setMessage("Please select a valid Home or Office location.");
      return;
    }

    if (!customerName.trim()) {
      setMessage("Please enter your name before requesting a service.");
      return;
    }

    setMessage("Sending service request...");

    try {
      /*
       * IMPORTANT:
       * Service-request creation is done through the SECURITY DEFINER
       * Supabase RPC function create_service_request.
       * This avoids the browser INSERT/RLS problem that was blocking
       * the request even though the button itself was working.
       */
      const { data, error } = await supabase.rpc(
        "create_service_request",
        {
          p_provider_id: selectedProvider.id,
          p_customer_name: customerName.trim(),
          p_service: selectedProvider.skill || skill,
          p_location: selectedLocation.address,
        }
      );

      if (error) {
        console.error(
          "CREATE SERVICE REQUEST ERROR:",
          JSON.stringify(error, null, 2)
        );

        setMessage(
          `Unable to send service request: ${
            error.message || "Request creation failed."
          }`
        );
        return;
      }

      if (!data) {
        console.error("CREATE SERVICE REQUEST RETURNED NO DATA");
        setMessage("Request was not confirmed. Please try again.");
        return;
      }

      const createdRequest = Array.isArray(data) ? data[0] : data;

      if (!createdRequest?.id) {
        console.error("INVALID REQUEST RESPONSE:", data);
        setMessage("Request was not confirmed. Please try again.");
        return;
      }

      setCurrentRequest(createdRequest);
      setRequestProvider(selectedProvider);
      setSelectedProvider(null);

      setMessage(
        "Service request sent successfully! Waiting for technician response. ⏳"
      );

      setCheckingStatus(true);
    } catch (err) {
      console.error("REQUEST SERVICE EXCEPTION:", err);
      setMessage("Something went wrong while sending the request. Please try again.");
    }
  }

  useEffect(() => {
    if (!currentRequest || !checkingStatus) {
      return;
    }

    const interval = setInterval(
      async () => {
        const { data, error } =
          await supabase
            .from("service_requests")
            .select("*")
            .eq("id", currentRequest.id)
            .single();

        if (error) {
          console.error(
            "STATUS CHECK ERROR:",
            JSON.stringify(error, null, 2)
          );

          return;
        }

        if (data) {
          setCurrentRequest(data);

          if (
            data.status === "accepted" ||
            data.status === "rejected"
          ) {
            setCheckingStatus(false);
          }
        }
      },
      3000
    );

    return () =>
      clearInterval(interval);
  }, [
    currentRequest,
    checkingStatus,
  ]);

  async function loadProviderDetails() {
    if (!currentRequest) {
      return;
    }

    const { data, error } =
      await supabase
        .from("providers")
        .select(
          `
          id,
          name,
          skill,
          location,
          experience,
          phone,
          profile_photo,
          latitude,
          longitude
          `
        )
        .eq(
          "id",
          currentRequest.provider_id
        )
        .single();

    if (error) {
      console.error(
        "PROVIDER ERROR:",
        JSON.stringify(error, null, 2)
      );

      return;
    }

    if (data) {
      const { data: ratings } =
        await supabase
          .from("ratings")
          .select("rating")
          .eq(
            "provider_id",
            data.id
          );

      const ratingList =
        ratings || [];

      const reviewCount =
        ratingList.length;

      const averageRating =
        reviewCount > 0
          ? ratingList.reduce(
              (
                total: number,
                item: { rating: number }
              ) =>
                total +
                Number(item.rating),
              0
            ) / reviewCount
          : 0;

      setRequestProvider({
        ...data,
        distance_km: 0,
        average_rating: averageRating,
        review_count: reviewCount,
      });
    }
  }

  useEffect(() => {
    if (
      currentRequest?.status ===
      "accepted"
    ) {
      loadProviderDetails();
    }
  }, [
    currentRequest?.status,
  ]);

  async function submitRating() {
    if (
      !currentRequest ||
      !requestProvider
    ) {
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage(
        "Please select a rating."
      );

      return;
    }

    setSubmittingRating(true);
    setMessage("");

    const { error } = await supabase
      .from("ratings")
      .insert([
        {
          service_request_id:
            currentRequest.id,

          provider_id:
            requestProvider.id,

          customer_name:
            customerName.trim(),

          rating,

          review:
            review.trim() || null,
        },
      ]);

    setSubmittingRating(false);

    if (error) {
      console.error(
        "RATING ERROR:",
        JSON.stringify(error, null, 2)
      );

      setMessage(
        "Unable to submit rating. Please try again."
      );

      return;
    }

    setRatingSubmitted(true);

    setMessage(
      "Thank you! Your rating has been submitted. ⭐"
    );
  }

  function selectService(
    serviceName: string
  ) {
    setSkill(serviceName);
    setShowServices(false);
    setMessage("");
    setProviders([]);
  }

  const selectedLocation =
    getSelectedLocation();

  return (
    <AuthGuard allowedType="customer">
      <main className="min-h-screen bg-gray-50">

      {/* NAVIGATION */}
      <nav className="bg-white px-8 py-5 shadow-sm">

        <div className="flex items-center justify-between">

          <a
            href="/customer"
            className="text-2xl font-bold text-blue-600"
          >
            JASVITO
          </a>

          <a
            href="/customer/profile"
            className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100"
          >
            My Profile
          </a>

        </div>

      </nav>

      <section className="mx-auto max-w-5xl px-6 py-16">

        {/* HEADING */}
        <div className="text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Local Services Marketplace
          </p>

          <h2 className="mt-3 text-4xl font-bold text-gray-900">
            What do you need help with?
          </h2>

          <p className="mt-4 text-gray-600">
            Find professionals closest to your service location.
          </p>

        </div>

        {/* SEARCH CARD */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-8 shadow-md">

          <label className="font-semibold text-gray-800">
            Service / Skill
          </label>

          <div className="relative">

            <input
              type="text"
              value={skill}
              onChange={(e) => {
                setSkill(e.target.value);
                setShowServices(true);
              }}
              onFocus={() =>
                setShowServices(true)
              }
              placeholder="Search or choose a service"
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 pr-12 outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() =>
                setShowServices(
                  !showServices
                )
              }
              className="absolute right-3 top-5 text-xl text-gray-500"
            >
              ▾
            </button>

          </div>

          {/* SERVICES */}
          {showServices && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">

              <p className="mb-3 text-sm font-semibold text-gray-500">
                POPULAR SERVICES
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">

                {services
                  .filter((service) =>
                    service.name
                      .toLowerCase()
                      .includes(
                        skill.toLowerCase()
                      )
                  )
                  .map((service) => (

                    <button
                      key={service.name}
                      type="button"
                      onClick={() =>
                        selectService(
                          service.name
                        )
                      }
                      className="rounded-xl border bg-white p-4 text-left hover:border-blue-500 hover:bg-blue-50"
                    >

                      <span className="text-2xl">
                        {service.icon}
                      </span>

                      <p className="mt-2 text-sm font-semibold text-gray-800">
                        {service.name}
                      </p>

                    </button>

                  ))}

              </div>

            </div>
          )}

          {/* LOCATION */}
          <div className="mt-8">

            <label className="font-semibold text-gray-800">
              Where do you need the service?
            </label>

            <div className="mt-4 grid grid-cols-2 gap-4">

              <button
                type="button"
                onClick={() =>
                  chooseLocation("home")
                }
                className={`rounded-xl border p-5 ${
                  locationType === "home"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >

                <div className="text-4xl">
                  🏠
                </div>

                <p className="mt-2 font-bold">
                  Home
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {customerProfile?.home_location ||
                    "Add Home location"}
                </p>

              </button>

              <button
                type="button"
                onClick={() =>
                  chooseLocation("office")
                }
                className={`rounded-xl border p-5 ${
                  locationType === "office"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 bg-white"
                }`}
              >

                <div className="text-4xl">
                  🏢
                </div>

                <p className="mt-2 font-bold">
                  Office
                </p>

                <p className="mt-1 truncate text-sm text-gray-500">
                  {customerProfile?.office_location ||
                    "Add Office location"}
                </p>

              </button>

            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-4">

              <p className="text-sm text-gray-500">
                Selected location
              </p>

              <p className="mt-1 font-semibold text-gray-800">
                {selectedLocation
                  ? `📍 ${selectedLocation.address}`
                  : "Please select a saved Home or Office location"}
              </p>

            </div>

          </div>

          <button
            onClick={
              findProfessionals
            }
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Finding Nearby Professionals..."
              : "Find Nearby Professionals"}
          </button>

          {message && (
            <p className="mt-4 text-center font-semibold text-gray-700">
              {message}
            </p>
          )}

        </div>

        {/* PROVIDER RESULTS */}
        {providers.length > 0 && (
          <div className="mt-12">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-2xl font-bold text-gray-900">
                  Professionals Near You
                </h3>

                <p className="mt-1 text-gray-600">
                  Closest professionals are shown first.
                </p>

              </div>

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                Within 30 km
              </span>

            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">

              {providers.map(
                (provider, index) => (

                  <div
                    key={provider.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-md"
                  >

                    {/* PHOTO */}
                    <div className="flex justify-center bg-gray-100 py-7">

                      {provider.profile_photo ? (
                        <img
                          src={
                            provider.profile_photo
                          }
                          alt={
                            provider.name
                          }
                          className="h-28 w-28 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-5xl">
                          👤
                        </div>
                      )}

                    </div>

                    <div className="p-6">

                      {index === 0 && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          ⭐ CLOSEST
                        </span>
                      )}

                      <h4 className="mt-4 text-xl font-bold text-gray-900">
                        {provider.name}
                      </h4>

                      <p className="mt-1 font-medium text-blue-600">
                        {provider.skill}
                      </p>

                      {/* RATING */}
                      <div className="mt-4">

                        {provider.review_count >
                        0 ? (
                          <div className="flex items-center gap-2">

                            <span className="font-bold text-gray-900">
                              ⭐{" "}
                              {provider.average_rating.toFixed(
                                1
                              )}
                            </span>

                            <span className="text-sm text-gray-500">
                              ·{" "}
                              {
                                provider.review_count
                              }{" "}
                              {provider.review_count ===
                              1
                                ? "review"
                                : "reviews"}
                            </span>

                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-500">
                            ⭐ New provider · No reviews yet
                          </span>
                        )}

                      </div>

                      {/* DISTANCE */}
                      <div className="mt-5 rounded-lg bg-blue-50 p-4">

                        <p className="text-sm text-gray-500">
                          Distance
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-700">
                          📍{" "}
                          {provider.distance_km.toFixed(
                            1
                          )}{" "}
                          km away
                        </p>

                      </div>

                      <div className="mt-4 space-y-2 text-gray-600">

                        <p>
                          📍{" "}
                          {provider.location}
                        </p>

                        <p>
                          🛠️{" "}
                          {
                            provider.experience
                          }{" "}
                          years experience
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          setSelectedProvider(
                            provider
                          )
                        }
                        className="mt-6 w-full rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-100"
                      >
                        View Profile
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>
        )}

        {/* CURRENT REQUEST */}
        {currentRequest && (
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-white p-8 shadow-md">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Your Service Request
            </p>

            <h3 className="mt-2 text-2xl font-bold text-gray-900">
              {currentRequest.service}
            </h3>

            <p className="mt-2 text-gray-600">
              📍 {currentRequest.location}
            </p>

            {currentRequest.status ===
              "pending" && (
              <div className="mt-6 rounded-xl bg-yellow-50 p-5">

                <p className="font-bold text-yellow-700">
                  ⏳ Waiting for technician response
                </p>

                <p className="mt-2 text-yellow-700">
                  Your request has been sent to{" "}
                  {requestProvider?.name ||
                    "the professional"}.
                </p>

              </div>
            )}

            {currentRequest.status ===
              "accepted" && (
              <div className="mt-6 rounded-xl bg-green-50 p-6">

                <p className="text-lg font-bold text-green-700">
                  ✓ Service Request Accepted!
                </p>

                {requestProvider && (
                  <div className="mt-5">

                    {/* PROVIDER PHOTO */}
                    <div className="flex items-center gap-4">

                      {requestProvider.profile_photo ? (
                        <img
                          src={
                            requestProvider.profile_photo
                          }
                          alt={
                            requestProvider.name
                          }
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl">
                          👤
                        </div>
                      )}

                      <div>

                        <p className="text-sm text-gray-500">
                          Technician
                        </p>

                        <p className="text-xl font-bold text-gray-900">
                          {
                            requestProvider.name
                          }
                        </p>

                        <p className="text-gray-600">
                          {
                            requestProvider.skill
                          }
                        </p>

                      </div>

                    </div>

                    {/* RATING */}
                    {requestProvider.review_count >
                      0 && (
                      <p className="mt-4 font-semibold text-gray-700">
                        ⭐{" "}
                        {requestProvider.average_rating.toFixed(
                          1
                        )}{" "}
                        ·{" "}
                        {
                          requestProvider.review_count
                        }{" "}
                        reviews
                      </p>
                    )}

                    {requestProvider.phone && (
                      <a
                        href={`tel:${requestProvider.phone}`}
                        className="mt-6 block w-full rounded-lg bg-green-600 px-6 py-4 text-center font-bold text-white hover:bg-green-700"
                      >
                        📞 Call Technician
                      </a>
                    )}

                    {/* RATING FORM */}
                    {!ratingSubmitted && (
                      <div className="mt-8 border-t pt-8">

                        <h3 className="text-xl font-bold text-gray-900">
                          Rate Your Experience
                        </h3>

                        <p className="mt-2 text-gray-600">
                          How was your experience with{" "}
                          {
                            requestProvider.name
                          }?
                        </p>

                        <div className="mt-5 flex justify-center gap-2">

                          {[1, 2, 3, 4, 5].map(
                            (star) => (

                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setRating(
                                    star
                                  )
                                }
                                className={`text-4xl ${
                                  star <=
                                  rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </button>

                            )
                          )}

                        </div>

                        <p className="mt-2 text-center font-semibold text-gray-700">
                          {rating === 0
                            ? "Select a rating"
                            : `${rating} out of 5`}
                        </p>

                        <textarea
                          value={review}
                          onChange={(e) =>
                            setReview(
                              e.target.value
                            )
                          }
                          placeholder="Write a review (optional)"
                          rows={4}
                          className="mt-5 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={
                            submitRating
                          }
                          disabled={
                            submittingRating
                          }
                          className="mt-4 w-full rounded-lg bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                          {submittingRating
                            ? "Submitting..."
                            : "Submit Rating"}
                        </button>

                      </div>
                    )}

                    {ratingSubmitted && (
                      <div className="mt-8 rounded-xl bg-yellow-50 p-5 text-center">

                        <p className="text-3xl">
                          ⭐⭐⭐⭐⭐
                        </p>

                        <p className="mt-2 font-bold text-yellow-700">
                          Thank you for your feedback!
                        </p>

                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {currentRequest.status ===
              "rejected" && (
              <div className="mt-6 rounded-xl bg-red-50 p-5">

                <p className="font-bold text-red-700">
                  ✕ Service Request Rejected
                </p>

                <p className="mt-2 text-red-600">
                  Please try another professional.
                </p>

              </div>
            )}

          </div>
        )}

      </section>

      {/* PROVIDER PROFILE POPUP */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-6 py-10">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* Photo */}
            <div className="flex justify-center rounded-t-2xl bg-gray-100 py-8">

              {selectedProvider.profile_photo ? (
                <img
                  src={
                    selectedProvider.profile_photo
                  }
                  alt={
                    selectedProvider.name
                  }
                  className="h-32 w-32 rounded-full object-cover shadow-md"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-100 text-5xl">
                  👤
                </div>
              )}

            </div>

            <div className="p-8">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-bold text-gray-900">
                  Professional Profile
                </h2>

                <button
                  onClick={() =>
                    setSelectedProvider(
                      null
                    )
                  }
                  className="text-2xl text-gray-500"
                >
                  ×
                </button>

              </div>

              <h3 className="mt-6 text-3xl font-bold text-blue-600">
                {
                  selectedProvider.name
                }
              </h3>

              <p className="mt-3 text-lg font-semibold">
                🛠️{" "}
                {
                  selectedProvider.skill
                }
              </p>

              {/* Rating */}
              <div className="mt-3">

                {selectedProvider.review_count >
                0 ? (
                  <p className="font-semibold text-gray-700">
                    ⭐{" "}
                    {selectedProvider.average_rating.toFixed(
                      1
                    )}{" "}
                    ·{" "}
                    {
                      selectedProvider.review_count
                    }{" "}
                    reviews
                  </p>
                ) : (
                  <p className="text-gray-500">
                    ⭐ New provider · No reviews yet
                  </p>
                )}

              </div>

              <p className="mt-3 text-gray-600">
                📍{" "}
                {
                  selectedProvider.location
                }
              </p>

              <p className="mt-3 text-gray-600">
                📏{" "}
                {selectedProvider.distance_km.toFixed(
                  1
                )}{" "}
                km away
              </p>

              <p className="mt-3 text-gray-600">
                🛠️{" "}
                {
                  selectedProvider.experience
                }{" "}
                years experience
              </p>

              {/* REQUEST */}
              <div className="mt-8 border-t pt-6">

                <label className="font-semibold">
                  Your Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your name"
                  className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
                />

                <button
                  onClick={
                    requestService
                  }
                  className="mt-4 w-full rounded-lg bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-800"
                >
                  Request Service
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      </main>
    </AuthGuard>
  );
}
