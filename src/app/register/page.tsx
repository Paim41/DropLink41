import AuthCard from "@/components/droplink/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your DropLink account",
};

export default function RegisterPage() {
  return <AuthCard mode="register" />;
}
