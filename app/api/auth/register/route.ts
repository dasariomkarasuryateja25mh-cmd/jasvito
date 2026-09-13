import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AccountType = "customer" | "provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const accountType = body.accountType as AccountType;
    const skill = String(body.skill || "").trim();
    const experience = Number(body.experience || 0);

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–30 characters and contain only letters, numbers or underscore." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must contain at least 6 characters." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (accountType !== "customer" && accountType !== "provider") {
      return NextResponse.json(
        { error: "Invalid account type." },
        { status: 400 }
      );
    }

    if (accountType === "provider" && !skill) {
      return NextResponse.json(
        { error: "Please select your service." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Users never enter or see an email.
    // Supabase uses this internal identity only.
    const internalEmail = `${username}@jasvito.local`;

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: {
          username,
          full_name: name,
          account_type: accountType,
          skill: accountType === "provider" ? skill : "",
          experience: accountType === "provider" ? experience : 0,
        },
      },
    });

    if (error) {
      console.error("SIGNUP ERROR:", error);

      const message = error.message.toLowerCase();

      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        return NextResponse.json(
          { error: "This username is already registered. Please choose another username." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Account could not be created." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        username,
        accountType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}