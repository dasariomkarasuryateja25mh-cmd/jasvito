import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!username) {
      return NextResponse.json(
        {
          error: "Please enter your username.",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          error: "Please enter your password.",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabasePublishableKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (
      !supabaseUrl ||
      !supabasePublishableKey
    ) {
      console.error(
        "Missing Supabase login environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Server authentication is not configured.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabasePublishableKey
    );

    const internalEmail =
      `${username}@jasvito.local`;

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

    if (error) {
      console.error(
        "LOGIN ERROR:",
        error.message
      );

      return NextResponse.json(
        {
          error:
            "Username or password is incorrect.",
        },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          error: "Login failed.",
        },
        { status: 401 }
      );
    }

    const {
      data: account,
      error: accountError,
    } =
      await supabase
        .from("user_accounts")
        .select("account_type")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (accountError) {
      console.error(
        "ACCOUNT LOOKUP ERROR:",
        accountError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load your account.",
        },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json(
        {
          error:
            "Account profile not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: data.user.id,
        accountType: account.account_type,
        accessToken:
          data.session?.access_token,
        refreshToken:
          data.session?.refresh_token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "LOGIN ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong during login.",
      },
      { status: 500 }
    );
  }
}