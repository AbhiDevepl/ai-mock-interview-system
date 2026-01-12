import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/actions/auth.action";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const isAuth = await isAuthenticated();

  if (!isAuth) {
    redirect("/sign-in");
  }

  return (
    <div className="root-layout">
      <nav>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="logo" width={38} height={32} />
          <h2 className="text-primary-100">PerpWise AI</h2>
        </Link>
      </nav>

      {children}
    </div>
  );
};

export default RootLayout;
