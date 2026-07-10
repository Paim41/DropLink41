import AuthCard from "@/components/droplink/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in to DropLink",
};

export default function LoginPage() {
  return <AuthCard mode="login" />;
}
