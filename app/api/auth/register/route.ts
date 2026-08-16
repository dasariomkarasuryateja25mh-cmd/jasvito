import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AccountType = "customer" | "provider";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    const name = String(body.name || "").trim();

    const accountType =
      body.accountType as AccountType;

    const skill = String(body.skill || "").trim();

    const experience = Number(body.experience || 0);

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3–30 characters and contain only letters, numbers or underscore.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Please enter your full name.",
        },
        { status: 400 }
      );
    }

    if (
      accountType !== "customer" &&
      accountType !== "provider"
    ) {
      return NextResponse.json(
        {
          error: "Invalid account type.",
        },
        { status: 400 }
      );
    }

    if (accountType === "provider" && !skill) {
      return NextResponse.json(
        {
          error: "Please select your service.",
        },
        { status: 400 }
      );
    }

    if (
      accountType === "provider" &&
      (experience < 0 || experience > 60)
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter valid years of experience.",
        },
        { status: 400 }
      );
    }

    // -----------------------------
    // SERVER SUPABASE CLIENT
    // -----------------------------

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Server authentication is not configured.",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // -----------------------------
    // INTERNAL AUTH EMAIL
    // -----------------------------

    const internalEmail =
      `${username}@jasvito.local`;

    // -----------------------------
    // CHECK EXISTING USER
    // -----------------------------

    const {
      data: existingUsers,
      error: listError,
    } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      console.error(
        "LIST USERS ERROR:",
        listError
      );

      return NextResponse.json(
        {
          error:
            "Unable to check username availability.",
        },
        { status: 500 }
      );
    }

    const usernameExists =
      existingUsers.users.some(
        (user) =>
          user.email?.toLowerCase() ===
          internalEmail
      );

    if (usernameExists) {
      return NextResponse.json(
        {
          error:
            "This username is already registered. Please choose another username.",
        },
        { status: 409 }
      );
    }

    // -----------------------------
    // CREATE AUTH USER
    // -----------------------------

    const {
      data: createdUser,
      error: createError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: internalEmail,

        password: password,

        email_confirm: true,

        user_metadata: {
          username,
          account_type: accountType,
          full_name: name,
          skill:
            accountType === "provider"
              ? skill
              : "",
          experience:
            accountType === "provider"
              ? experience
              : 0,
        },
      });

    if (createError) {
      console.error(
        "CREATE USER ERROR:",
        createError
      );

      return NextResponse.json(
        {
          error:
            createError.message ||
            "Unable to create account.",
        },
        { status: 400 }
      );
    }

    if (!createdUser.user) {
      return NextResponse.json(
        {
          error:
            "Account could not be created.",
        },
        { status: 500 }
      );
    }

    // -----------------------------
    // CREATE USER ACCOUNT
    // -----------------------------

    const { error: accountError } =
      await supabaseAdmin
        .from("user_accounts")
        .insert({
          user_id: createdUser.user.id,
          username: username,
          account_type: accountType,
        });

    if (accountError) {
      console.error(
        "USER ACCOUNT ERROR:",
        accountError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        createdUser.user.id
      );

      return NextResponse.json(
        {
          error:
            "Account profile could not be created.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully.",
        username,
        accountType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "REGISTER ROUTE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}