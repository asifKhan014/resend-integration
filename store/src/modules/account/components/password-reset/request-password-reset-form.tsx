"use client"

import { requestPasswordReset } from "@lib/data/customer"
import { Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

type RequestPasswordResetState = {
  success: boolean
  error: string | null
}

const initialState: RequestPasswordResetState = {
  success: false,
  error: null,
}

const RequestPasswordResetForm = () => {
  const [state, formAction] = useActionState(
    requestPasswordReset,
    initialState
  )

  return (
    <form
      className="w-full flex flex-col gap-y-4"
      action={formAction}
      data-testid="request-reset-form"
    >
      <Input
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        data-testid="reset-email-input"
      />
      <ErrorMessage error={state.error} />
      {state.success && (
        <Text className="text-emerald-500 text-small-regular">
          If an account exists with that email, we&apos;ll send reset
          instructions shortly.
        </Text>
      )}
      <SubmitButton className="w-full mt-2" data-testid="request-reset-button">
        Send reset email
      </SubmitButton>
    </form>
  )
}

export default RequestPasswordResetForm
