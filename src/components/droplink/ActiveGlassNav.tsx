"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudUpload, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

export default function ActiveGlassNav({ brand }: { brand: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const authActive = isActive("/login") || isActive("/register") || isActive("/forgot-password");

  useEffect(() => {
    let ignore = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      });
    return () => {
      ignore = true;
    };
  }, [pathname]);

  return (
    <header className="glass-nav">
      {brand}
      <nav className="nav-links" aria-label="Primary navigation">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : undefined} href={item.href} key={item.href}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="nav-actions">
        {user ? (
          <Link aria-current={isActive("/dashboard") ? "page" : undefined} className={`ghost-button account-button ${isActive("/dashboard") ? "is-active" : ""}`} href="/dashboard">
            <UserRound className="size-4" />
            <span>{user.email}</span>
          </Link>
        ) : (
          <Link aria-current={authActive ? "page" : undefined} className={`ghost-button ${authActive ? "is-active" : ""}`} href="/login">
            Login
          </Link>
        )}
        <Link aria-current={isActive("/upload") ? "page" : undefined} className={`glow-button ${isActive("/upload") ? "is-active" : ""}`} href="/upload">
          <CloudUpload className="size-4" />
          Upload Files
        </Link>
      </div>
    </header>
  );
}
