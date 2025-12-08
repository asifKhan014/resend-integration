import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

type OrderShippedEmailProps = {
  order: {
    display_id?: number
    email?: string | null
  }
  tracking_links?: { url?: string | null }[]
}

function OrderShippedEmailComponent({ order, tracking_links }: OrderShippedEmailProps) {
  const links = (tracking_links || []).filter((t) => t?.url)
  return (
    <Html>
      <Head />
      <Preview>Your order has shipped</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[520px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[10px] mx-0">
              Your Order Has Shipped
            </Heading>

            <Section className="my-[16px] px-[12px] text-center">
              <Text className="text-[14px] text-[#111827] m-0">
                Order ID: <strong>{order.display_id ? `#${order.display_id}` : order.email}</strong>
              </Text>
            </Section>

            {links.length ? (
              <Section className="my-[20px] px-[12px] text-center">
                <Heading className="text-[16px] font-semibold m-0 mb-[8px]">Tracking</Heading>
                {links.map((t, idx) => (
                  <Text key={idx} className="text-[14px] text-[#2563eb] m-0 underline">
                    <Link href={t.url || ""}>{t.url}</Link>
                  </Text>
                ))}
              </Section>
            ) : null}

            <Text className="text-[#6b7280] text-[13px] leading-[22px] text-center mt-[16px]">
              We’ll notify you once your package is delivered.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderShippedEmail = (props: OrderShippedEmailProps) => (
  <OrderShippedEmailComponent {...props} />
)

const mockOrder: OrderShippedEmailProps["order"] = {
  display_id: 5678,
  email: "customer@example.com",
}

export default () => (
  <OrderShippedEmailComponent
    order={mockOrder}
    tracking_links={[
      { url: "https://tracking.example.com/track/5678" },
    ]}
  />
)
