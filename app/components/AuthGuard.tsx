"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type AccountType = "customer" | "provider";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedType: AccountType;
};

export default function AuthGuard({
  children,
  allowedType,
}: AuthGuardProps) {
  const router = useRouter();

  const [checking, setChecking] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: account, error } =
        await supabase
          .from("user_accounts")
          .select("account_type")
          .eq("user_id", user.id)
          .maybeSingle();

      if (error || !account) {
        console.error(
          "AUTH ACCOUNT ERROR:",
          JSON.stringify(
            error,
            null,
            2
          )
        );

        await supabase.auth.signOut();

        router.replace("/login");
        return;
      }

      if (
        account.account_type !==
        allowedType
      ) {
        if (
          account.account_type ===
          "customer"
        ) {
          router.replace("/customer");
        } else {
          router.replace("/provider");
        }

        return;
      }

      if (mounted) {
        setAllowed(true);
        setChecking(false);
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [allowedType, router]);

  if (checking || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 font-semibold text-gray-600">
            Checking your account...
          </p>

        </div>
      </main>
    );
  }

  return <>{children}</>;
}