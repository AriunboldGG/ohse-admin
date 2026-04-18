"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const { login, isAuthenticated, isLoading, resetPassword } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/admin/products")
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const success = await login(email, password)
      if (success) {
        // Don't redirect here - let the useEffect handle it when isAuthenticated becomes true
        // This ensures the auth state is fully updated before redirecting
      }
    } catch (err: any) {
      // Handle Firebase Auth errors
      let errorMessage = "An error occurred. Please try again."
      
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (err?.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (err?.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format."
      } else if (err?.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled. Please contact support."
      } else if (err?.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      } else if (err?.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection."
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      console.error("Login error details:", {
        code: err?.code,
        message: err?.message,
        error: err
      })
      
      setError(errorMessage)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError("")
    setResetSuccess(false)
    setIsResetting(true)

    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
      setTimeout(() => {
        setIsForgotPasswordOpen(false)
        setResetEmail("")
        setResetSuccess(false)
      }, 3000)
    } catch (err: any) {
      let errorMessage = "An error occurred. Please try again."
      
      if (err?.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (err?.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format."
      } else if (err?.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later."
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setResetError(errorMessage)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl">Bayanundur Admin</CardTitle>
          <CardDescription>
            Sign in to access your admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          
          {resetSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium">Password reset email sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check your inbox at {resetEmail} and follow the instructions to reset your password.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetError && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isResetting}
                  autoComplete="email"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsForgotPasswordOpen(false)
                    setResetEmail("")
                    setResetError("")
                  }}
                  disabled={isResetting}
                >
                  Хаах
                </Button>
                <Button type="submit" disabled={isResetting}>
                  {isResetting ? "Sending..." : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

