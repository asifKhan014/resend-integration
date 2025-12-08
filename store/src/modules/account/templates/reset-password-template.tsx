import RequestPasswordResetForm from "../components/password-reset/request-password-reset-form"
import ResetPasswordForm from "../components/password-reset/reset-password-form"

type ResetPasswordTemplateProps = {
  token?: string
  email?: string
}

const ResetPasswordTemplate = ({ token, email }: ResetPasswordTemplateProps) => {
  const hasToken = !!token

  return (
    <div className="w-full flex justify-start px-8 py-8">
      <div
        className="max-w-lg w-full flex flex-col items-start gap-y-4"
        data-testid="reset-password-page"
      >
        <h1 className="text-large-semi uppercase">
          {hasToken ? "Set a new password" : "Reset your password"}
        </h1>
        <p className="text-base-regular text-ui-fg-base">
          {hasToken
            ? "Choose a new password to secure your account."
            : "Enter the email associated with your account and we'll send reset instructions if it exists."}
        </p>
        {hasToken && email && (
          <p className="text-small-regular text-ui-fg-subtle">
            Resetting password for <span className="font-semibold">{email}</span>
          </p>
        )}

        {hasToken ? (
          <ResetPasswordForm token={token} email={email} />
        ) : (
          <RequestPasswordResetForm />
        )}
      </div>
    </div>
  )
}

export default ResetPasswordTemplate
