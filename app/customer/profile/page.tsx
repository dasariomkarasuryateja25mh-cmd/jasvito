"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type LocationType = "home" | "office";

type CustomerProfile = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  profile_photo: string | null;

  home_location: string | null;
  home_latitude: number | null;
  home_longitude: number | null;

  office_location: string | null;
  office_latitude: number | null;
  office_longitude: number | null;
};

export default function CustomerProfilePage() {
  const [profile, setProfile] =
    useState<CustomerProfile | null>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [photoUrl, setPhotoUrl] =
    useState<string | null>(null);

  const [homeLocation, setHomeLocation] =
    useState("");

  const [officeLocation, setOfficeLocation] =
    useState("");

  const [homeLatitude, setHomeLatitude] =
    useState<number | null>(null);

  const [homeLongitude, setHomeLongitude] =
    useState<number | null>(null);

  const [officeLatitude, setOfficeLatitude] =
    useState<number | null>(null);

  const [officeLongitude, setOfficeLongitude] =
    useState<number | null>(null);

  const [homeEnabled, setHomeEnabled] =
    useState(false);

  const [officeEnabled, setOfficeEnabled] =
    useState(false);

  const [selectedLocation, setSelectedLocation] =
    useState<LocationType>("home");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] =
    useState(false);
  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error(
        "AUTH USER ERROR:",
        JSON.stringify(
          authError,
          null,
          2
        )
      );

      setMessage(
        "Please login before opening your profile."
      );

      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("customer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "PROFILE LOAD ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setMessage(
        "Unable to load your profile."
      );

      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);

      setName(data.name || "");
      setPhone(data.phone || "");

      setPhotoUrl(
        data.profile_photo || null
      );

      setHomeLocation(
        data.home_location || ""
      );

      setOfficeLocation(
        data.office_location || ""
      );

      setHomeLatitude(
        data.home_latitude ?? null
      );

      setHomeLongitude(
        data.home_longitude ?? null
      );

      setOfficeLatitude(
        data.office_latitude ?? null
      );

      setOfficeLongitude(
        data.office_longitude ?? null
      );

      setHomeEnabled(
        !!data.home_location
      );

      setOfficeEnabled(
        !!data.office_location
      );

      if (data.home_location) {
        setSelectedLocation("home");
      } else if (data.office_location) {
        setSelectedLocation("office");
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function uploadPhoto(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Please choose an image smaller than 5 MB."
      );
      return;
    }

    setUploadingPhoto(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploadingPhoto(false);
      setMessage(
        "Please login first."
      );
      return;
    }

    const extension =
      file.name.split(".").pop() ||
      "jpg";

    const filePath =
      `customers/${user.id}/profile.${extension}`;

    const { error } =
      await supabase.storage
        .from("profile-photos")
        .upload(
          filePath,
          file,
          {
            upsert: true,
            contentType: file.type,
          }
        );

    if (error) {
      console.error(
        "PHOTO UPLOAD ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setUploadingPhoto(false);

      setMessage(
        "Unable to upload profile photo."
      );

      return;
    }

    const {
      data: publicData,
    } =
      supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

    setPhotoUrl(
      `${publicData.publicUrl}?t=${Date.now()}`
    );

    setUploadingPhoto(false);

    setMessage(
      "Profile photo uploaded successfully! 📷"
    );
  }

  async function reverseGeocode(
    latitude: number,
    longitude: number
  ) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            Accept:
              "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Reverse geocoding failed"
        );
      }

      const data =
        await response.json();

      const address =
        data.address || {};

      const parts = [
        address.amenity ||
          address.building ||
          address.shop ||
          address.tourism ||
          address.road,

        address.suburb ||
          address.neighbourhood ||
          address.city_district,

        address.city ||
          address.town ||
          address.municipality,

        address.state,

        address.country,
      ].filter(Boolean);

      if (parts.length > 0) {
        return parts.join(
          ", "
        );
      }

      if (data.display_name) {
        return data.display_name;
      }

      return `${latitude.toFixed(
        6
      )}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error(
        "REVERSE GEOCODING ERROR:",
        error
      );

      return `${latitude.toFixed(
        6
      )}, ${longitude.toFixed(6)}`;
    }
  }

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
      async (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setMessage(
          "Getting your address from GPS... 📍"
        );

        const readableAddress =
          await reverseGeocode(
            latitude,
            longitude
          );

        if (
          selectedLocation ===
          "home"
        ) {
          setHomeLatitude(
            latitude
          );

          setHomeLongitude(
            longitude
          );

          setHomeLocation(
            readableAddress
          );

          setHomeEnabled(true);
        } else {
          setOfficeLatitude(
            latitude
          );

          setOfficeLongitude(
            longitude
          );

          setOfficeLocation(
            readableAddress
          );

          setOfficeEnabled(true);
        }

        setGettingLocation(false);

        setMessage(
          `${
            selectedLocation ===
            "home"
              ? "Home"
              : "Office"
          } location found successfully! 📍`
        );
      },
      (error) => {
        console.error(
          "LOCATION ERROR:",
          error.code,
          error.message
        );

        setGettingLocation(false);

        if (error.code === 1) {
          setMessage(
            "Location permission was denied. Please allow location access."
          );
        } else if (
          error.code === 2
        ) {
          setMessage(
            "Your location could not be determined. Please try again."
          );
        } else if (
          error.code === 3
        ) {
          setMessage(
            "Location request timed out. Please try again."
          );
        } else {
          setMessage(
            "Unable to get your location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function toggleHome() {
    const newValue =
      !homeEnabled;

    setHomeEnabled(
      newValue
    );

    if (!newValue) {
      setHomeLocation("");
      setHomeLatitude(null);
      setHomeLongitude(null);
    } else {
      setSelectedLocation(
        "home"
      );
    }
  }

  function toggleOffice() {
    const newValue =
      !officeEnabled;

    setOfficeEnabled(
      newValue
    );

    if (!newValue) {
      setOfficeLocation("");
      setOfficeLatitude(null);
      setOfficeLongitude(null);
    } else {
      setSelectedLocation(
        "office"
      );
    }
  }

  async function saveProfile() {
    if (!userId) {
      setMessage(
        "Please login before saving your profile."
      );
      return;
    }

    if (!name.trim()) {
      setMessage(
        "Please enter your name."
      );
      return;
    }

    if (!phone.trim()) {
      setMessage(
        "Please enter your phone number."
      );
      return;
    }

    if (
      homeEnabled &&
      !homeLocation.trim()
    ) {
      setMessage(
        "Please add your Home location or turn Home off."
      );
      return;
    }

    if (
      officeEnabled &&
      !officeLocation.trim()
    ) {
      setMessage(
        "Please add your Office location or turn Office off."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const profileData = {
      user_id: userId,

      name: name.trim(),

      phone: phone.trim(),

      profile_photo:
        photoUrl,

      home_location:
        homeEnabled &&
        homeLocation.trim()
          ? homeLocation.trim()
          : null,

      home_latitude:
        homeEnabled
          ? homeLatitude
          : null,

      home_longitude:
        homeEnabled
          ? homeLongitude
          : null,

      office_location:
        officeEnabled &&
        officeLocation.trim()
          ? officeLocation.trim()
          : null,

      office_latitude:
        officeEnabled
          ? officeLatitude
          : null,

      office_longitude:
        officeEnabled
          ? officeLongitude
          : null,
    };

    const { data, error } =
      await supabase
        .from(
          "customer_profiles"
        )
        .update(profileData)
        .eq(
          "user_id",
          userId
        )
        .select()
        .maybeSingle();

    setSaving(false);

    if (error) {
      console.error(
        "PROFILE SAVE ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setMessage(
        "Unable to save your profile."
      );

      return;
    }

    if (!data) {
      setMessage(
        "Your profile was not found."
      );

      return;
    }

    setProfile(data);

    setMessage(
      "Profile saved successfully! ✅"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="bg-white px-8 py-5 shadow-sm">

        <div className="mx-auto flex max-w-4xl items-center justify-between">

          <a
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            JASVITO
          </a>

          <a
            href="/customer"
            className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100"
          >
            Back to Services
          </a>

        </div>

      </nav>

      <section className="mx-auto max-w-3xl px-6 py-12">

        <div className="rounded-2xl bg-white p-8 shadow-md">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Customer Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Your Profile
            </h1>

            <p className="mt-2 text-gray-600">
              Manage your personal details and service locations.
            </p>

          </div>

          {/* PHOTO */}

          <div className="mt-8 text-center">

            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="mx-auto h-32 w-32 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-100 text-5xl">
                👤
              </div>
            )}

            <label className="mt-5 inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">

              {uploadingPhoto
                ? "Uploading..."
                : "📷 Upload Profile Photo"}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={
                  uploadingPhoto
                }
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];

                  if (file) {
                    uploadPhoto(
                      file
                    );
                  }
                }}
              />

            </label>

            <p className="mt-2 text-xs text-gray-500">
              Maximum 5 MB
            </p>

          </div>

          {/* NAME */}

          <div className="mt-8">

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
              placeholder="Enter your name"
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            />

          </div>

          {/* PHONE */}

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
              placeholder="Enter your phone number"
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            />

          </div>

          {/* LOCATIONS */}

          <div className="mt-10">

            <h2 className="text-xl font-bold text-gray-900">
              Service Locations
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Choose Home, Office or both.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">

              <button
                type="button"
                onClick={
                  toggleHome
                }
                className={`rounded-xl border p-5 ${
                  homeEnabled
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

                <p className="mt-1 text-sm text-gray-500">
                  {homeEnabled
                    ? "Selected"
                    : "Not selected"}
                </p>

              </button>

              <button
                type="button"
                onClick={
                  toggleOffice
                }
                className={`rounded-xl border p-5 ${
                  officeEnabled
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

                <p className="mt-1 text-sm text-gray-500">
                  {officeEnabled
                    ? "Selected"
                    : "Not selected"}
                </p>

              </button>

            </div>

            {/* HOME */}

            {homeEnabled && (
              <div className="mt-6 rounded-xl border bg-gray-50 p-6">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLocation(
                      "home"
                    )
                  }
                  className="text-lg font-bold text-gray-900"
                >
                  🏠 Home Location
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(
                      "home"
                    );

                    setTimeout(
                      getCurrentLocation,
                      0
                    );
                  }}
                  disabled={
                    gettingLocation
                  }
                  className="mt-5 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {gettingLocation &&
                  selectedLocation ===
                    "home"
                    ? "Finding your address..."
                    : "📍 Use Current GPS Location"}
                </button>

                <div className="my-5 flex items-center gap-3">

                  <div className="h-px flex-1 bg-gray-300" />

                  <span className="text-sm font-semibold text-gray-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-gray-300" />

                </div>

                <label className="font-semibold text-gray-800">
                  Home Address
                </label>

                <input
                  type="text"
                  value={
                    homeLocation
                  }
                  onChange={(e) => {
                    setHomeLocation(
                      e.target.value
                    );

                    setHomeLatitude(
                      null
                    );

                    setHomeLongitude(
                      null
                    );
                  }}
                  placeholder="Example: Charminar, Hyderabad, Telangana, India"
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4 outline-none focus:border-blue-500"
                />

                {homeLatitude !==
                  null &&
                  homeLongitude !==
                    null && (
                    <div className="mt-4 rounded-lg bg-green-50 p-4">

                      <p className="font-semibold text-green-700">
                        ✓ GPS coordinates saved
                      </p>

                      <p className="mt-1 text-xs text-green-600">
                        Used for nearby provider matching.
                      </p>

                    </div>
                  )}

              </div>
            )}

            {/* OFFICE */}

            {officeEnabled && (
              <div className="mt-6 rounded-xl border bg-gray-50 p-6">

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLocation(
                      "office"
                    )
                  }
                  className="text-lg font-bold text-gray-900"
                >
                  🏢 Office Location
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation(
                      "office"
                    );

                    setTimeout(
                      getCurrentLocation,
                      0
                    );
                  }}
                  disabled={
                    gettingLocation
                  }
                  className="mt-5 w-full rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {gettingLocation &&
                  selectedLocation ===
                    "office"
                    ? "Finding your address..."
                    : "📍 Use Current GPS Location"}
                </button>

                <div className="my-5 flex items-center gap-3">

                  <div className="h-px flex-1 bg-gray-300" />

                  <span className="text-sm font-semibold text-gray-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-gray-300" />

                </div>

                <label className="font-semibold text-gray-800">
                  Office Address
                </label>

                <input
                  type="text"
                  value={
                    officeLocation
                  }
                  onChange={(e) => {
                    setOfficeLocation(
                      e.target.value
                    );

                    setOfficeLatitude(
                      null
                    );

                    setOfficeLongitude(
                      null
                    );
                  }}
                  placeholder="Example: Hitech City, Hyderabad, Telangana, India"
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4 outline-none focus:border-blue-500"
                />

                {officeLatitude !==
                  null &&
                  officeLongitude !==
                    null && (
                    <div className="mt-4 rounded-lg bg-green-50 p-4">

                      <p className="font-semibold text-green-700">
                        ✓ GPS coordinates saved
                      </p>

                      <p className="mt-1 text-xs text-green-600">
                        Used for nearby provider matching.
                      </p>

                    </div>
                  )}

              </div>
            )}

          </div>

          {message && (
            <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center font-semibold text-blue-700">
              {message}
            </div>
          )}

          <button
            onClick={
              saveProfile
            }
            disabled={
              saving ||
              uploadingPhoto ||
              gettingLocation
            }
            className="mt-6 w-full rounded-lg bg-gray-900 px-6 py-4 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving
              ? "Saving Profile..."
              : "Save Profile"}
          </button>

        </div>

      </section>

    </main>
  );
}