"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn, useSession } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session?.user) router.push("/");
  }, [session, router]);

  const handleLogin = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const res = await signIn.email({ email, password });

      if (res?.error) {
        toast.error(res.error.message || res.error.statusText || "Email atau password salah");
        return;
      }

      if (res?.data) {
        toast.success("Berhasil masuk!");
        // Gunakan hard navigation agar cookie session terkirim dengan benar
        window.location.href = "/";
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 animate-fade-in-up relative">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-2">
          <span className="font-extrabold text-foreground text-xl tracking-tight">
            prd<span className="text-primary">forge</span>.ai
          </span>
        </div>

        <Card className="bg-card border-border shadow-xl shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-foreground">Selamat datang kembali</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Masuk untuk melanjutkan generate PRD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Account Hint */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <p className="font-medium text-foreground mb-1 text-xs uppercase tracking-wider text-primary">
                🧪 Akun Demo
              </p>
              <div className="space-y-0.5 text-muted-foreground">
                <p>
                  Email:{" "}
                  <button
                    type="button"
                    className="font-mono text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => {
                      setEmail("demo@prdforge.ai");
                      setPassword("password123");
                    }}
                  >
                    demo@prdforge.ai
                  </button>
                </p>
                <p>
                  Password:{" "}
                  <button
                    type="button"
                    className="font-mono text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => {
                      setEmail("demo@prdforge.ai");
                      setPassword("password123");
                    }}
                  >
                    password123
                  </button>
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1.5">
                Klik kredensial di atas untuk mengisi otomatis
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kamu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input border-border focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:border-primary/50 transition-colors"
                />
              </div>
              <button
                id="login-btn"
                onClick={handleLogin}
                disabled={isLoading}
                className={buttonVariants({ variant: "default", className: "w-full" })}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Masuk...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Daftar gratis
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            ← Kembali ke halaman utama
          </Link>
        </div>
      </div>
    </div>
  );
}
