import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { token } = req.body as { token?: string }

  if (!token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Verification token is required."
    )
  }

  const configModule = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const { http } = configModule.projectConfig

  let payload: any

  try {
    payload = jwt.verify(token, http.jwtSecret, http.jwtOptions)
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid or expired verification link."
    )
  }

  if (
    payload?.purpose !== "email_verification" ||
    payload?.actor_type !== "customer"
  ) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid verification token."
    )
  }

  const email =
    (payload?.email as string | undefined)?.trim() ||
    (payload?.entity_id as string | undefined)?.trim()
  const normalizedEmail = email?.toLowerCase()
  const emailCandidates = Array.from(
    new Set([normalizedEmail, email].filter(Boolean))
  ) as string[]

  if (!emailCandidates.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Verification token is missing the account email."
    )
  }

  const authModuleService = req.scope.resolve(Modules.AUTH)
  const authIdentityProvider =
    authModuleService.getAuthIdentityProviderService("emailpass")

  const findAuthIdentity = async () => {
    for (const candidate of emailCandidates) {
      const authIdentity = await authIdentityProvider
        .retrieve({
          entity_id: candidate,
        })
        .catch(() => undefined)

      if (authIdentity?.id) {
        return authIdentity
      }
    }
    return undefined
  }

  const authIdentity = await findAuthIdentity()

  const now = new Date().toISOString()
  if (authIdentity?.id) {
    const appMetadata = {
      ...(authIdentity.app_metadata ?? {}),
      email_verified: true,
      email_verified_at: now,
      email_verification_required: false,
    }

    await authModuleService.updateAuthIdentities({
      id: authIdentity.id,
      app_metadata: appMetadata,
    })
  }

  const remoteQuery = req.scope.resolve(
    ContainerRegistrationKeys.REMOTE_QUERY
  )
  const query = remoteQueryObjectFromString({
    entryPoint: "customer",
    variables: {
      filters: { email: emailCandidates },
      take: 1,
    },
    fields: ["id", "metadata"],
  })

  const { rows } = await remoteQuery(query)
  const customer = rows?.[0]

  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)

  if (customer?.id) {
    await customerModuleService.updateCustomers(customer.id, {
      metadata: {
        ...(customer.metadata ?? {}),
        email_verified: true,
        email_verified_at: now,
        email_verification_required: false,
      },
    })
  } else {
    // Fallback: update by selector in case remote query missed it
    await customerModuleService.updateCustomers(
      { email: emailCandidates },
      {
        metadata: {
          email_verified: true,
          email_verified_at: now,
          email_verification_required: false,
        },
      }
    )
  }

  res.status(200).json({ success: true })
}
