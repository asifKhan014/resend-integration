import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function fulfillmentCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ order_id: string; fulfillment_id: string; no_notification?: boolean }>) {
  const { data } = event

  if (!data?.order_id || data?.no_notification) {
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
      "fulfillments.id",
    ],
    filters: {
      id: data.order_id,
    },
  })

  if (!order?.email) {
    return
  }

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-fulfillment-created",
    data: {
      order: {
        display_id: order.display_id,
        email: order.email,
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
