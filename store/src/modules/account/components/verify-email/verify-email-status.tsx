"use client"

import { sdk } from "@lib/config"
import { Button, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useEffect, useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

type VerifyEmailStatusProps = {
  token?: string
  email?: string
}

const VerifyEmailStatus = ({ token, email }: VerifyEmailStatusProps) => {
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<Status>("idle")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setError("Invalid verification link. Request a new one and try again.")
      return
    }

    const controller = new AbortController()

    const verify = async () => {
      setStatus("loading")
      setError(null)
      try {
        await sdk.client.fetch(`/store/customers/verify-email`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: { token },
          signal: controller.signal,
        })
        setStatus("success")
      } catch (err: any) {
        setStatus("error")
        setError(
          err?.message ||
            "We couldn't verify this link. Request a new one and try again."
        )
      }
    }

    void verify()

    return () => controller.abort()
  }, [token])

  const resend = async () => {
    if (!email) return

    setResendStatus("loading")
    try {
      await sdk.client.fetch(`/store/customers/send-verification`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: { email },
      })
      setResendStatus("success")
    } catch (err: any) {
      setResendStatus("error")
      setError(
        err?.message ||
          "We couldn't send a new verification email. Please try again."
      )
    }
  }

  const showResend = !!email

  return (
    <div className="flex flex-col gap-y-3">
      {status === "loading" && (
        <Text className="text-ui-fg-base">Verifying your email...</Text>
      )}

      {status === "success" && (
        <div className="flex flex-col gap-y-2">
          <Text className="text-emerald-600 text-small-regular">
            Email verified. You can now sign in with your account.
          </Text>
          <LocalizedClientLink
            href="/account"
            className="text-ui-fg-interactive underline text-small-regular"
          >
            Go to sign in
          </LocalizedClientLink>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-y-2">
          <ErrorMessage error={error} />
          {showResend && (
            <div className="flex items-center gap-x-2">
              <Button
                size="small"
                variant="secondary"
                onClick={resend}
                isLoading={resendStatus === "loading"}
                disabled={resendStatus === "success"}
              >
                Resend verification email
              </Button>
              {resendStatus === "success" && (
                <Text className="text-emerald-600 text-small-regular">
                  Sent. Check your inbox.
                </Text>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VerifyEmailStatus
