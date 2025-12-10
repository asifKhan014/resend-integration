import VerifyEmailStatus from "../components/verify-email/verify-email-status"

type VerifyEmailTemplateProps = {
  token?: string
  email?: string
}

const VerifyEmailTemplate = ({ token, email }: VerifyEmailTemplateProps) => {
  const hasToken = !!token

  return (
    <div className="w-full flex justify-start px-8 py-8">
      <div className="max-w-lg w-full flex flex-col gap-y-4">
        <h1 className="text-large-semi uppercase">Verify your email</h1>
        <p className="text-base-regular text-ui-fg-base">
          {hasToken
            ? "Hang tight while we confirm your account."
            : "We&apos;ve sent you an email to confirm your account. Click the link in that email, or verify using the link below."}
        </p>
        {email && (
          <p className="text-small-regular text-ui-fg-subtle">
            Email: <span className="font-semibold">{email}</span>
          </p>
        )}

        <VerifyEmailStatus token={token} email={email} />
      </div>
    </div>
  )
}

export default VerifyEmailTemplate
