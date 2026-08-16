"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type ProviderProfile = {
  id: string;
  user_id: string;
  name: string;
  skill: string;
  location: string | null;
  experience: number;
  phone: string | null;
  profile_photo: string | null;
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

export default function ProviderProfilePage() {
  const [profile, setProfile] =
    useState<ProviderProfile | null>(null);

  const [userId, setUserId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [skill, setSkill] = useState("");
  const [experience, setExperience] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [photoUrl, setPhotoUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [gettingLocation, setGettingLocation] =
    useState(false);

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [message, setMessage] =
    useState("");

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

    const { data, error } =
      await supabase
        .from("providers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
      console.error(
        "PROVIDER PROFILE LOAD ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setMessage(
        "Unable to load your provider profile."
      );

      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);

      setName(data.name || "");
      setPhone(data.phone || "");
      setSkill(data.skill || "");

      setExperience(
        data.experience !== null &&
        data.experience !== undefined
          ? String(data.experience)
          : ""
      );

      setLocation(
        data.location || ""
      );

      setLatitude(
        data.latitude ?? null
      );

      setLongitude(
        data.longitude ?? null
      );

      setPhotoUrl(
        data.profile_photo || null
      );
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

    if (!userId) {
      setMessage(
        "Please login first."
      );
      return;
    }

    setUploadingPhoto(true);
    setMessage("");

    const extension =
      file.name.split(".").pop() ||
      "jpg";

    const filePath =
      `providers/${userId}/profile.${extension}`;

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
    lat: number,
    lng: number
  ) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
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

      return `${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error(
        "REVERSE GEOCODING ERROR:",
        error
      );

      return `${lat.toFixed(
        6
      )}, ${lng.toFixed(6)}`;
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage(
        "Location services are not supported by this browser."
      );
      return;
    }

    setGettingLocation(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setMessage(
          "Getting your service address from GPS... 📍"
        );

        const readableAddress =
          await reverseGeocode(
            lat,
            lng
          );

        setLatitude(lat);
        setLongitude(lng);
        setLocation(
          readableAddress
        );

        setGettingLocation(false);

        setMessage(
          "Service location found successfully! 📍"
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

  function updateManualLocation(
    value: string
  ) {
    setLocation(value);

    // Manual addresses don't have
    // reliable coordinates.
    setLatitude(null);
    setLongitude(null);
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

    if (!skill) {
      setMessage(
        "Please select your service."
      );
      return;
    }

    if (!experience) {
      setMessage(
        "Please enter your years of experience."
      );
      return;
    }

    if (!location.trim()) {
      setMessage(
        "Please add your service location."
      );
      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setMessage(
        "Please use GPS location so customers can find you within 30 km."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } =
      await supabase
        .from("providers")
        .update({
          user_id: userId,
          name: name.trim(),
          phone: phone.trim(),
          skill,
          experience:
            Number(experience) || 0,
          location:
            location.trim(),
          profile_photo:
            photoUrl,
          latitude,
          longitude,
        })
        .eq(
          "user_id",
          userId
        )
        .select()
        .maybeSingle();

    setSaving(false);

    if (error) {
      console.error(
        "PROVIDER SAVE ERROR:",
        JSON.stringify(
          error,
          null,
          2
        )
      );

      setMessage(
        "Unable to save your provider profile."
      );

      return;
    }

    if (!data) {
      setMessage(
        "Your provider profile was not found."
      );

      return;
    }

    setProfile(data);

    setMessage(
      "Provider profile saved successfully! ✅"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading your provider profile...
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
            href="/provider"
            className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100"
          >
            Provider Dashboard
          </a>

        </div>

      </nav>

      <section className="mx-auto max-w-3xl px-6 py-12">

        <div className="rounded-2xl bg-white p-8 shadow-md">

          <div className="text-center">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Provider Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Your Professional Profile
            </h1>

            <p className="mt-2 text-gray-600">
              Help customers find and choose you.
            </p>

          </div>

          {/* PROFILE PHOTO */}

          <div className="mt-8 text-center">

            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Provider profile"
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

          {/* SKILL */}

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

          {/* EXPERIENCE */}

          <div className="mt-6">

            <label className="font-semibold text-gray-800">
              Years of Experience
            </label>

            <input
              type="number"
              min="0"
              max="60"
              value={experience}
              onChange={(e) =>
                setExperience(
                  e.target.value
                )
              }
              placeholder="Example: 5"
              className="mt-3 w-full rounded-lg border border-gray-300 p-4 outline-none focus:border-blue-500"
            />

          </div>

          {/* LOCATION */}

          <div className="mt-10">

            <h2 className="text-xl font-bold text-gray-900">
              Service Location
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Your GPS location is used to match you with customers within 30 km.
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
                ? "Finding Your Address..."
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
              Service Address
            </label>

            <input
              type="text"
              value={location}
              onChange={(e) =>
                updateManualLocation(
                  e.target.value
                )
              }
              placeholder="Example: Charminar, Hyderabad, Telangana, India"
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-4 outline-none focus:border-blue-500"
            />

            {latitude !== null &&
              longitude !== null && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">

                  <p className="font-semibold text-green-700">
                    ✓ GPS location saved
                  </p>

                  <p className="mt-1 text-xs text-green-600">
                    Coordinates will be used for distance matching.
                  </p>

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
              : "Save Provider Profile"}
          </button>

        </div>

      </section>

    </main>
  );
}