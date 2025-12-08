import { createWorkflow, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";
import type { CreateNotificationDTO } from "@medusajs/framework/types";

type WorkflowInput = {
  id: string
}

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "customer.*",
        "total",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "item_subtotal",
        "item_total",
        "item_tax_total",
      ],
      filters: {
        id
      },
      options: {
        throwIfKeyNotFound: true
      }
    })
    
    const order = orders[0]
    const adminEmail = process.env.ADMIN_ORDER_EMAIL

    const notifications: CreateNotificationDTO[] = []

    if (order.email) {
      notifications.push({
        to: order.email,
        channel: "email",
        template: "order-placed",
        data: { order }
      })
    }

    if (adminEmail) {
      notifications.push({
        to: adminEmail,
        channel: "email",
        template: "order-placed-admin",
        data: { order }
      })
    }

    const notification = when({ notifications }, ({ notifications }) => notifications.length > 0)
      .then(() => sendNotificationStep(notifications))

    return new WorkflowResponse({
      notification
    })
  }
)
