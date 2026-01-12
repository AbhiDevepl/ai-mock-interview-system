import { ReactNode } from "react";
import "@/app/globals.css";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const isAuth = await isAuthenticated();

  if (isAuth) {
    redirect("/");
  }

  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;
