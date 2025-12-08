import { 
  AbstractNotificationProviderService, 
  MedusaError
} from "@medusajs/framework/utils"
import { 
  ProviderSendNotificationDTO, 
  ProviderSendNotificationResultsDTO,
  Logger
} from "@medusajs/framework/types";
import { 
  CreateEmailOptions, 
  Resend
} from "resend";
import type React from "react"
import { orderPlacedEmail } from "./emails/order-placed";
import { orderPlacedAdminEmail } from "./emails/order-placed-admin";
import { userInvitedEmail } from "./emails/user-invited";
import { passwordResetEmail } from "./emails/password-reset";
import { orderCanceledEmail } from "./emails/order-canceled";
import { orderFulfillmentCreatedEmail } from "./emails/order-fulfillment-created";
import { orderShippedEmail } from "./emails/order-shipped";
import { orderDeliveredEmail } from "./emails/order-delivered";

enum Templates {
  ORDER_PLACED = "order-placed",
  ORDER_PLACED_ADMIN = "order-placed-admin",
  USER_INVITED = "user-invited",
  PASSWORD_RESET = "password-reset",
  ORDER_CANCELED = "order-canceled",
  ORDER_FULFILLMENT_CREATED = "order-fulfillment-created",
  ORDER_SHIPPED = "order-shipped",
  ORDER_DELIVERED = "order-delivered",
}

const templates: {[key in Templates]?: (props: unknown) => React.ReactNode} = {
  [Templates.ORDER_PLACED]: orderPlacedEmail,
  [Templates.ORDER_PLACED_ADMIN]: orderPlacedAdminEmail,
  [Templates.USER_INVITED]: userInvitedEmail,
  [Templates.PASSWORD_RESET]: passwordResetEmail,
  [Templates.ORDER_CANCELED]: orderCanceledEmail,
  [Templates.ORDER_FULFILLMENT_CREATED]: orderFulfillmentCreatedEmail,
  [Templates.ORDER_SHIPPED]: orderShippedEmail,
  [Templates.ORDER_DELIVERED]: orderDeliveredEmail,
}

type ResendOptions = {
  api_key: string
  from: string
  html_templates?: Record<string, {
    subject?: string
    content: string
  }>
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor(
    { logger }: InjectedDependencies, 
    options: ResendOptions
  ) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }
  }


  getTemplate(template: Templates) {
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates[template].content
    }
    const allowedTemplates = Object.keys(templates)

    if (!allowedTemplates.includes(template)) {
      return null
    }

    return templates[template]
  }

  getTemplateSubject(template: Templates) {
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject
    }
    switch(template) {
      case Templates.ORDER_PLACED:
        return "Order Confirmation"
      case Templates.ORDER_PLACED_ADMIN:
        return "New Order Received"
      case Templates.USER_INVITED:
        return "You're Invited!"
      case Templates.PASSWORD_RESET:
        return "Reset Your Password"
      case Templates.ORDER_CANCELED:
        return "Order Canceled"
      case Templates.ORDER_FULFILLMENT_CREATED:
        return "Your Order Is Being Prepared"
      case Templates.ORDER_SHIPPED:
        return "Your Order Has Shipped"
      case Templates.ORDER_DELIVERED:
        return "Order Delivered"
      default:
        return "New Email"
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates)

    if (!template) {
      this.logger.error(`Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(Templates)}`)
      return {}
    }

    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
    }

    let emailOptions: CreateEmailOptions
    if (typeof template === "string") {
      emailOptions = {
        ...commonOptions,
        html: template,
      }
    } else {
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
      }
    }

    const { data, error } = await this.resendClient.emails.send(emailOptions)

    if (error || !data) {
      if (error) {
        this.logger.error("Failed to send email", error)
      } else {
        this.logger.error("Failed to send email: unknown error")
      }
      return {}
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
