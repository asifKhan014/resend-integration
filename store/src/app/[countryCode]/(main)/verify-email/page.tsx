import { Metadata } from "next"

import VerifyEmailTemplate from "@modules/account/templates/verify-email-template"

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your account before signing in.",
}

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function VerifyEmailPage(
  props: VerifyEmailPageProps
) {
  const searchParams = await props.searchParams

  return (
    <VerifyEmailTemplate
      token={searchParams?.token}
      email={searchParams?.email}
    />
  )
}
