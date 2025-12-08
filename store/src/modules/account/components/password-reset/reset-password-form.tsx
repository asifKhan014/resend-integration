"use client"

import { resetPasswordWithToken } from "@lib/data/customer"
import { Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

type ResetPasswordState = {
  success: boolean
  error: string | null
}

const initialState: ResetPasswordState = {
  success: false,
  error: null,
}

type ResetPasswordFormProps = {
  token?: string
  email?: string
}

const ResetPasswordForm = ({ token, email }: ResetPasswordFormProps) => {
  const [state, formAction] = useActionState(
    resetPasswordWithToken,
    initialState
  )

  const missingToken = !token
  const missingEmail = !email
  const disabled = missingToken || missingEmail || state.success

  return (
    <form
      className="w-full flex flex-col gap-y-4"
      action={formAction}
      data-testid="reset-password-form"
    >
      <input type="hidden" name="token" value={token ?? ""} />
      <input type="hidden" name="email" value={email ?? ""} />

      <Input
        label="New password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        disabled={disabled}
        data-testid="new-password-input"
      />
      <Input
        label="Confirm password"
        name="confirm_password"
        type="password"
        required
        autoComplete="new-password"
        disabled={disabled}
        data-testid="confirm-password-input"
      />

      {missingToken && (
        <Text className="text-amber-600 text-small-regular">
          This link is missing a reset token. Request a new email to continue.
        </Text>
      )}

      {missingEmail && (
        <Text className="text-amber-600 text-small-regular">
          We couldn&apos;t read your email from this link. Open the reset link
          from your inbox again.
        </Text>
      )}

      {state.success && (
        <div className="flex flex-col gap-y-1">
          <Text className="text-emerald-500 text-small-regular">
            Password updated. You can now sign in with your new credentials.
          </Text>
          <LocalizedClientLink
            href="/account"
            className="underline text-ui-fg-interactive text-small-regular"
          >
            Go to sign in
          </LocalizedClientLink>
        </div>
      )}

      <ErrorMessage error={state.error} />

      <SubmitButton
        className="w-full mt-2"
        data-testid="reset-password-button"
        disabled={disabled}
      >
        Reset password
      </SubmitButton>
    </form>
  )
}

export default ResetPasswordForm
