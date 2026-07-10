"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { AppBackground, Brand, icons } from "./common";

type Mode = "login" | "register" | "forgot";
type SubmitState = "idle" | "loading" | "success";

const successColor = "#2F8F5B";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passwordChecks(password: string) {
  return [
    { label: "At least 8 characters", valid: password.length >= 8 },
    { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
    { label: "At least one number", valid: /\d/.test(password) },
    { label: "At least one special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function friendlyError(message: string, mode: Mode) {
  const lower = message.toLowerCase();
  if (lower.includes("already")) return "An account with this email already exists.";
  if (lower.includes("too many")) return mode === "register" ? "Registration rate limit reached. Please wait and try again." : "Too many login attempts. Please wait and try again.";
  if (lower.includes("invalid email") || lower.includes("invalid login")) return "Incorrect email or password.";
  if (lower.includes("database") || lower.includes("prisma") || lower.includes("connect")) {
    return mode === "register"
      ? "Database is not ready. Start PostgreSQL and run the Prisma migration before registering."
      : "Database is not ready. Start PostgreSQL and run the Prisma migration before signing in.";
  }
  if (lower.includes("session_secret")) return "Authentication is not configured. Set SESSION_SECRET in .env.";
  if (mode === "login") return "Incorrect email or password.";
  return message || "Server error. Please try again.";
}

function AuthSkeleton() {
  return (
    <div className="auth-card glass-card auth-skeleton" aria-label="Loading authentication form">
      <div className="skeleton-line logo" />
      <div className="skeleton-line eyebrow-skel" />
      <div className="skeleton-line title" />
      <div className="skeleton-line copy" />
      <div className="skeleton-line input" />
      <div className="skeleton-line input" />
      <div className="skeleton-line button" />
    </div>
  );
}

export default function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => {
    let ignore = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .catch(() => null)
      .finally(() => {
        if (!ignore) setCheckingSession(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const checks = useMemo(() => passwordChecks(form.password), [form.password]);
  const passwordValid = checks.every((check) => check.valid);
  const nameValid = form.name.trim().length >= 2;
  const emailValid = isEmail(form.email);
  const confirmValid = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const strength = checks.filter((check) => check.valid).length;
  const strengthLabel = ["Weak", "Weak", "Fair", "Good", "Good", "Strong"][strength] ?? "Weak";
  const registerReady = nameValid && emailValid && passwordValid && confirmValid && terms;
  const loginReady = emailValid && form.password.length > 0;
  const canSubmit = mode === "register" ? registerReady : mode === "login" ? loginReady : form.email.length > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (mode === "forgot") {
      setMessage("Password recovery is self-hosted. Use your configured admin recovery process or reset the account password hash.");
      return;
    }
    if (mode === "register" && !registerReady) {
      setPasswordTouched(true);
      setConfirmTouched(true);
      setMessage(!terms ? "You must agree to the Terms of Service and Privacy Policy." : "Please complete the highlighted fields before creating an account.");
      return;
    }
    if (mode === "login" && !loginReady) {
      setMessage(!emailValid ? "Please enter a valid email address." : "Please enter your password.");
      return;
    }

    setSubmitState("loading");
    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          remember,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Server error");
      setSubmitState("success");
      setMessage(mode === "register" ? "Account created" : "Login successful");
      window.setTimeout(() => {
        router.push(mode === "register" ? "/upload" : "/dashboard");
        router.refresh();
      }, 650);
    } catch (error) {
      setSubmitState("idle");
      setMessage(friendlyError(error instanceof Error ? error.message : "Server error", mode));
    }
  }

  if (checkingSession) {
    return (
      <AppBackground>
        <section className="auth-screen auth-stage">
          <AuthSkeleton />
        </section>
      </AppBackground>
    );
  }

  const loading = submitState === "loading";
  const success = submitState === "success";
  const securityLabel = mode === "login" ? "WELCOME BACK" : "SECURE ACCESS";
  const heading = mode === "register" ? "Create your DropLink account" : mode === "forgot" ? "Recover access" : "Log in to DropLink";
  const copy = mode === "register"
    ? "Use an account to manage links, analytics, and Telegram notifications."
    : mode === "forgot"
      ? "Password recovery is handled by your self-hosted DropLink administrator."
      : "Access your temporary links, download activity, and Telegram notifications.";

  return (
    <AppBackground>
      <section className="auth-screen auth-stage">
        <div className="auth-orb auth-orb-red" />
        <div className="auth-orb auth-orb-warm" />
        <div className="auth-card glass-card">
          <Brand />
          <div className="auth-heading">
            <span className="eyebrow"><icons.LockKeyhole className="size-4" /> {securityLabel}</span>
            <h1>{heading}</h1>
            <p>{copy}</p>
          </div>

          <form onSubmit={submit} className="form-stack auth-form" noValidate>
            {mode === "register" && (
              <Field
                id="auth-name"
                label="Full name"
                value={form.name}
                placeholder="Enter your full name"
                autoComplete="name"
                valid={nameValid}
                invalid={form.name.length > 0 && !nameValid}
                error="Please enter your full name."
                onChange={(value) => setForm({ ...form, name: value })}
              />
            )}

            <Field
              id="auth-email"
              label="Email address"
              type="email"
              value={form.email}
              placeholder="you@example.com"
              autoComplete="email"
              valid={emailValid}
              invalid={form.email.length > 0 && !emailValid}
              error="Please enter a valid email address."
              onChange={(value) => setForm({ ...form, email: value })}
            />

            {mode !== "forgot" && (
              <>
                <PasswordField
                  id="auth-password"
                  label="Password"
                  value={form.password}
                  placeholder={mode === "register" ? "Create a secure password" : "Enter your password"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  shown={showPassword}
                  setShown={setShowPassword}
                  valid={mode === "register" ? passwordValid : form.password.length > 0}
                  invalid={passwordTouched && (mode === "register" ? !passwordValid : form.password.length === 0)}
                  error={mode === "register" ? "Your password does not meet the requirements." : "Please enter your password."}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(value) => setForm({ ...form, password: value })}
                />

                {mode === "register" && (
                  <>
                    <div className="password-helper" id="password-requirements">
                      {checks.map((check) => (
                        <span className={check.valid ? "complete" : ""} key={check.label}>
                          {check.valid ? <Check className="size-3.5" /> : <span className="requirement-dot" />}
                          {check.label}
                        </span>
                      ))}
                    </div>
                    <div className="strength-wrap" aria-live="polite">
                      <span className={`strength-bar strength-${strength}`} />
                      <small>Password strength: {strengthLabel}</small>
                    </div>

                    <PasswordField
                      id="auth-confirm-password"
                      label="Confirm password"
                      value={form.confirmPassword}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      shown={showConfirm}
                      setShown={setShowConfirm}
                      valid={confirmValid}
                      invalid={confirmTouched && form.confirmPassword.length > 0 && !confirmValid}
                      error="Passwords do not match."
                      successText="Passwords match"
                      onBlur={() => setConfirmTouched(true)}
                      onChange={(value) => setForm({ ...form, confirmPassword: value })}
                    />
                  </>
                )}
              </>
            )}

            {mode === "login" && (
              <div className="auth-options">
                <label className="check-row">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                  Remember me
                </label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {mode === "register" && (
              <label className="check-row terms-row">
                <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
                <span>I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</span>
              </label>
            )}

            {message && (
              <p className={success ? "form-message auth-success" : "form-message auth-alert"} role="alert" aria-live="polite">
                {success ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
                {message}
              </p>
            )}

            <button className="glow-button auth-submit full" disabled={loading || success || !canSubmit} type="submit">
              {success ? <Check className="size-4" /> : loading ? <LoaderCircle className="size-4 spin" /> : null}
              {success ? (mode === "register" ? "Account created" : "Login successful") : loading ? (mode === "register" ? "Creating account..." : "Logging in...") : mode === "register" ? "Create Account" : mode === "forgot" ? "Show Recovery Guidance" : "Log In"}
              {!loading && !success && <icons.ArrowRight className="size-4 arrow-shift" />}
            </button>
          </form>

          {mode === "register" ? (
            <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
          ) : mode === "login" ? (
            <p className="auth-switch">Don&apos;t have an account? <Link href="/register">Create one</Link></p>
          ) : (
            <p className="auth-switch">Remembered it? <Link href="/login">Log in</Link></p>
          )}
        </div>
      </section>
    </AppBackground>
  );
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  type?: string;
  valid?: boolean;
  invalid?: boolean;
  error?: string;
}) {
  const describedBy = props.invalid ? `${props.id}-error` : props.valid ? `${props.id}-success` : undefined;
  return (
    <div className="auth-field">
      <label htmlFor={props.id}>{props.label}</label>
      <div className={`input-shell ${props.valid ? "is-valid" : ""} ${props.invalid ? "is-invalid" : ""}`}>
        <input
          id={props.id}
          type={props.type ?? "text"}
          value={props.value}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          aria-invalid={props.invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => props.onChange(event.target.value)}
        />
        {props.valid && <Check className="field-icon" style={{ color: successColor }} aria-hidden />}
        {props.invalid && <AlertCircle className="field-icon" aria-hidden />}
      </div>
      {props.invalid && <small id={`${props.id}-error`} className="field-error">{props.error}</small>}
    </div>
  );
}

function PasswordField(props: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  shown: boolean;
  setShown: (value: boolean) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
  valid?: boolean;
  invalid?: boolean;
  error?: string;
  successText?: string;
}) {
  const describedBy = props.invalid ? `${props.id}-error` : props.valid && props.successText ? `${props.id}-success` : undefined;
  return (
    <div className="auth-field">
      <label htmlFor={props.id}>{props.label}</label>
      <div className={`input-shell password-shell ${props.valid ? "is-valid" : ""} ${props.invalid ? "is-invalid" : ""}`}>
        <input
          id={props.id}
          type={props.shown ? "text" : "password"}
          value={props.value}
          placeholder={props.placeholder}
          autoComplete={props.autoComplete}
          aria-invalid={props.invalid || undefined}
          aria-describedby={describedBy}
          onBlur={props.onBlur}
          onChange={(event) => props.onChange(event.target.value)}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={props.shown ? "Hide password" : "Show password"}
          onClick={() => props.setShown(!props.shown)}
        >
          {props.shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {props.invalid && <small id={`${props.id}-error`} className="field-error">{props.error}</small>}
      {props.valid && props.successText && <small id={`${props.id}-success`} className="field-success">{props.successText}</small>}
    </div>
  );
}
