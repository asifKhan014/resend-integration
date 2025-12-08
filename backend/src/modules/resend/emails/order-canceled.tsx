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

type OrderCanceledEmailProps = {
  order: {
    display_id?: number
    reason?: string | null
  }
}

function OrderCanceledEmailComponent({ order }: OrderCanceledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been canceled</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[520px]">
            <Heading className="text-black text-[24px] font-semibold text-center p-0 my-[10px] mx-0">
              Order Canceled
            </Heading>

            <Text className="text-black text-[14px] leading-[24px] text-center">
              Your order{order.display_id ? ` #${order.display_id}` : ""} has been canceled.
            </Text>

            {order.reason && (
              <Section className="my-[20px] px-[12px]">
                <Text className="text-[14px] text-[#111827] m-0">
                  Reason: <strong>{order.reason}</strong>
                </Text>
              </Section>
            )}

            <Hr className="border border-solid border-[#eaeaea] my-[24px]" />

            <Text className="text-[#6b7280] text-[13px] leading-[22px] text-center">
              If you believe this was a mistake, please reply to this email and we’ll be happy to help.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export const orderCanceledEmail = (props: OrderCanceledEmailProps) => (
  <OrderCanceledEmailComponent {...props} />
)

const mockOrder: OrderCanceledEmailProps["order"] = {
  display_id: 1005,
  reason: "Requested by customer",
}

export default () => <OrderCanceledEmailComponent order={mockOrder} />
