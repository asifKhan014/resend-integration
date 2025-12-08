import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderDeliveredHandler({
  event,
  container,
}: SubscriberArgs<{ id?: string; fulfillment_id?: string; order_id?: string; no_notification?: boolean }>) {
  const { data } = event

  if (data?.no_notification) {
    return
  }

  const fulfillmentId = data?.fulfillment_id || data?.id
  if (!fulfillmentId) {
    return
  }

  const query = container.resolve("query")
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const { data: [link] = [] } = await query.graph({
    entity: "order_fulfillment",
    fields: [
      "order.id",
      "order.display_id",
      "order.email",
    ],
    filters: { fulfillment_id: fulfillmentId },
  })

  if (!link?.order?.email) {
    return
  }

  await notificationModuleService.createNotifications({
    to: link.order.email,
    channel: "email",
    template: "order-delivered",
    data: {
      order: {
        display_id: link.order.display_id,
        email: link.order.email,
      },
    },
  })
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}
