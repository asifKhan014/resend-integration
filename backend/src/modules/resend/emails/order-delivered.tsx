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

type OrderDeliveredEmailProps = {
  order: {
    display_id?: number
    email?: string | null
  }
}

function OrderDeliveredEmailComponent({ order }: OrderDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been delivered</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[520px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[10px] mx-0">
              Order Delivered
            </Heading>

            <Section className="my-[16px] px-[12px] text-center">
              <Text className="text-[14px] text-[#111827] m-0">
                Order ID: <strong>{order.display_id ? `#${order.display_id}` : order.email}</strong>
              </Text>
            </Section>

            <Text className="text-[#6b7280] text-[13px] leading-[22px] text-center mt-[16px]">
              We hope you enjoy your purchase. If anything is wrong with your order, reply to this email and we’ll help right away.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderDeliveredEmail = (props: OrderDeliveredEmailProps) => (
  <OrderDeliveredEmailComponent {...props} />
)

const mockOrder: OrderDeliveredEmailProps["order"] = {
  display_id: 9012,
  email: "customer@example.com",
}

export default () => <OrderDeliveredEmailComponent order={mockOrder} />
