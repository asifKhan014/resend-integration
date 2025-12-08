import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"

type OrderFulfillmentCreatedEmailProps = {
  order: {
    display_id?: number
    email?: string | null
  }
}

function OrderFulfillmentCreatedEmailComponent({ order }: OrderFulfillmentCreatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order is being prepared</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[520px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[10px] mx-0">
              We’re preparing your order
            </Heading>

            <Section className="my-[16px] px-[12px] text-center">
              <Text className="text-[14px] text-[#111827] m-0">
                Order ID: <strong>{order.display_id ? `#${order.display_id}` : order.email}</strong>
              </Text>
              <Text className="text-[14px] text-[#4b5563] m-0 mt-[6px]">
                We’ve started processing your shipment. You’ll receive tracking details once it ships.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderFulfillmentCreatedEmail = (props: OrderFulfillmentCreatedEmailProps) => (
  <OrderFulfillmentCreatedEmailComponent {...props} />
)

const mockOrder: OrderFulfillmentCreatedEmailProps["order"] = {
  display_id: 1234,
  email: "customer@example.com",
}

export default () => <OrderFulfillmentCreatedEmailComponent order={mockOrder} />
