import {
  Text,
  Container,
  Heading,
  Html,
  Section,
  Tailwind,
  Head,
  Preview,
  Body,
  Link,
  Button,
} from "@react-email/components"

type EmailVerificationProps = {
  verify_url: string
  email?: string
}

function EmailVerificationComponent({ verify_url, email }: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Confirm your email
              </Heading>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                Hello{email ? ` ${email}` : ""},
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Thanks for creating an account. Please confirm this email
                address so we can finish setting up your account.
              </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={verify_url}
              >
                Verify email
              </Button>
            </Section>

            <Section className="my-[32px]">
              <Text className="text-black text-[14px] leading-[24px]">
                Or copy and paste this URL into your browser:
              </Text>
              <Link
                href={verify_url}
                className="text-blue-600 no-underline text-[14px] leading-[24px] break-all"
              >
                {verify_url}
              </Link>
            </Section>

            <Section className="mt-[32px] pt-[20px] border-t border-solid border-[#eaeaea]">
              <Text className="text-[#666666] text-[12px] leading-[24px]">
                If you didn&apos;t create this account, you can ignore this email
                or contact support.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const emailVerificationEmail = (props: EmailVerificationProps) => (
  <EmailVerificationComponent {...props} />
)

const mockData: EmailVerificationProps = {
  verify_url: "https://your-app.com/verify-email?token=sample-token",
  email: "user@example.com",
}

export default () => <EmailVerificationComponent {...mockData} />
