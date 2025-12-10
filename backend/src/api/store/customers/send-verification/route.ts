import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
  MedusaError,
  generateJwtToken,
} from "@medusajs/framework/utils"
import { resolveStorefrontUrl } from "../../../../utils/storefront-url"

const TOKEN_EXPIRY = "24h"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const configModule = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  const authModuleService = req.scope.resolve(Modules.AUTH)

  const rawEmail =
    ((req.body?.email as string | undefined) ||
      (req.auth_context as any)?.actor_id ||
      "")?.trim()
  const normalizedEmail = rawEmail?.toLowerCase()
  const emailCandidates = Array.from(
    new Set([normalizedEmail, rawEmail].filter(Boolean))
  ) as string[]
  const email = normalizedEmail || rawEmail

  if (!email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Email is required to send a verification link."
    )
  }

  const authIdentityProvider =
    authModuleService.getAuthIdentityProviderService("emailpass")

  const findAuthIdentity = async () => {
    for (const candidate of emailCandidates) {
      const identity = await authIdentityProvider
        .retrieve({
          entity_id: candidate,
        })
        .catch(() => undefined)

      if (identity?.id) return identity
    }
    return undefined
  }

  try {
    const authIdentity = await findAuthIdentity()

    if (authIdentity?.id) {
      const appMetadata = {
        ...(authIdentity.app_metadata ?? {}),
        email_verification_required: true,
        email_verified: authIdentity.app_metadata?.email_verified === true,
      }

      await authModuleService.updateAuthIdentities({
        id: authIdentity.id,
        app_metadata: appMetadata,
      })
    }
  } catch (error) {
    // Swallow errors to avoid leaking existence of accounts.
  }

  const { http } = configModule.projectConfig

  const token = generateJwtToken(
    {
      entity_id: email,
      provider: "emailpass",
      actor_type: "customer",
      purpose: "email_verification",
    },
    {
      secret: http.jwtSecret,
      expiresIn: TOKEN_EXPIRY,
      jwtOptions: http.jwtOptions,
    }
  )

  const urlPrefix = resolveStorefrontUrl(configModule)

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "email-verification",
    data: {
      verify_url: `${urlPrefix}/verify-email?token=${token}&email=${encodeURIComponent(
        email
      )}`,
    },
  })

  res.status(200).json({ success: true })
}
