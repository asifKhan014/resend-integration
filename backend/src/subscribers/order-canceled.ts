import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderCanceledHandler({
  event,
  container,
}: SubscriberArgs<{ id: string; reason?: string }>) {
  const orderId = event.data.id
  if (!orderId) {
    return
  }

  const query = container.resolve("query")
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const { data: [order] = [] } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
    ],
    filters: { id: orderId },
  })

  if (!order?.email) {
    return
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-canceled",
    data: {
      order: {
        display_id: order.display_id,
        reason: event.data.reason || "Your order was canceled",
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
