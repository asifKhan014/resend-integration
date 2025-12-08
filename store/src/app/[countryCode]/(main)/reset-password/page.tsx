import { Metadata } from "next"

import ResetPasswordTemplate from "@modules/account/templates/reset-password-template"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a reset link or set a new password for your account.",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function ResetPasswordPage(props: ResetPasswordPageProps) {
  const searchParams = await props.searchParams

  return (
    <ResetPasswordTemplate
      token={searchParams?.token}
      email={searchParams?.email}
    />
  )
}
