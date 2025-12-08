import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

type OrderPlacedAdminEmailProps = {
  order: {
    display_id?: number
    email?: string | null
    total?: number | string | null
    currency_code?: string | null
  }
}

function OrderPlacedAdminEmailComponent({ order }: OrderPlacedAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New order received</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[520px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[10px] mx-0">
              New Order Received
            </Heading>

            <Section className="my-[16px] px-[12px] text-center">
              <Text className="text-[14px] text-[#111827] m-0">
                Order ID: <strong>{order.display_id ? `#${order.display_id}` : order.email}</strong>
              </Text>
              {order.email && (
                <Text className="text-[14px] text-[#4b5563] m-0 mt-[6px]">
                  Customer: {order.email}
                </Text>
              )}
              {order.total && order.currency_code && (
                <Text className="text-[14px] text-[#4b5563] m-0 mt-[6px]">
                  Total: {order.total} {order.currency_code.toUpperCase?.() || order.currency_code}
                </Text>
              )}
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[24px]" />

            <Text className="text-[#6b7280] text-[13px] leading-[22px] text-center">
              You can view the order details in the admin dashboard.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderPlacedAdminEmail = (props: OrderPlacedAdminEmailProps) => (
  <OrderPlacedAdminEmailComponent {...props} />
)

const mockOrder: OrderPlacedAdminEmailProps["order"] = {
  display_id: 1025,
  email: "customer@example.com",
  total: 120,
  currency_code: "usd",
}

export default () => <OrderPlacedAdminEmailComponent order={mockOrder} />
