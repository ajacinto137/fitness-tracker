"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiSend, ClientApiError } from "@/lib/client-fetch";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/auth/register", "POST", { name, email, password });
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created, but sign-in failed. Try signing in manually.");
        router.push("/login");
        return;
      }
      router.push("/weight");
      router.refresh();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary">
          <Dumbbell className="h-7 w-7 text-accent-ink" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Create your account</h1>
        <p className="text-ink-secondary">Start tracking your weight and lifts</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <Input
          id="name"
          label="Name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="email"
          type="email"
          autoComplete="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent-soft">
          Sign in
        </Link>
      </p>
    </div>
  );
}
