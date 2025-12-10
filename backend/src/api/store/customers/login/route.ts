import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  generateJwtToken,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

const buildTokenFromAuthIdentity = (
  authIdentity: any,
  actorType: string,
  authProvider: string,
  httpConfig: any
) => {
  const entityIdKey = `${actorType}_id`
  const entityId = authIdentity?.app_metadata?.[entityIdKey]
  const providerIdentity = authProvider
    ? authIdentity.provider_identities?.find(
        (identity: any) => identity.provider === authProvider
      )
    : undefined

  return generateJwtToken(
    {
      actor_id: entityId ?? "",
      actor_type: actorType,
      auth_identity_id: authIdentity?.id ?? "",
      app_metadata: {
        [entityIdKey]: entityId,
      },
      user_metadata: providerIdentity?.user_metadata ?? {},
    },
    {
      secret: httpConfig.jwtSecret,
      expiresIn: httpConfig.jwtExpiresIn,
      jwtOptions: httpConfig.jwtOptions,
    }
  )
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const rawEmail = (req.body?.email as string | undefined)?.trim()
  const normalizedEmail = rawEmail?.toLowerCase()
  const emailCandidates = Array.from(
    new Set([normalizedEmail, rawEmail].filter(Boolean))
  ) as string[]
  const password = req.body?.password as string | undefined

  if (!emailCandidates.length || !password) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Email and password are required."
    )
  }

  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const authService = req.scope.resolve(Modules.AUTH)
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const authIdentityProvider =
    authService.getAuthIdentityProviderService("emailpass")

  const findCustomer = async () => {
    for (const candidate of emailCandidates) {
      const query = remoteQueryObjectFromString({
        entryPoint: "customer",
        variables: {
          filters: { email: candidate },
          take: 1,
        },
        fields: ["id", "email", "metadata"],
      })

      const { rows } = await remoteQuery(query)
      if (rows?.[0]) {
        return rows[0]
      }
    }
    return null
  }

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

  let customer = await findCustomer()

  const customerRequiresVerification =
    customer?.metadata?.email_verification_required !== false
  const customerVerified = customer?.metadata?.email_verified === true

  const preFetchedAuthIdentity = await findAuthIdentity()

  // Ensure auth identity knows about the customer id for token generation
  if (
    preFetchedAuthIdentity?.id &&
    customer?.id &&
    preFetchedAuthIdentity.app_metadata?.customer_id !== customer.id
  ) {
    await authService.updateAuthIdentities({
      id: preFetchedAuthIdentity.id,
      app_metadata: {
        ...(preFetchedAuthIdentity.app_metadata ?? {}),
        customer_id: customer.id,
      },
    })

    preFetchedAuthIdentity.app_metadata = {
      ...(preFetchedAuthIdentity.app_metadata ?? {}),
      customer_id: customer.id,
    }
  }

  const authRequiresVerification =
    preFetchedAuthIdentity?.app_metadata?.email_verification_required !== false
  const authVerified =
    preFetchedAuthIdentity?.app_metadata?.email_verified === true

  // If customer record is missing but auth identity exists, create a minimal customer
  if (!customer && preFetchedAuthIdentity?.id) {
    const creationEmail =
      normalizedEmail ||
      rawEmail ||
      preFetchedAuthIdentity.provider_identities?.[0]?.entity_id

    try {
      const created = await customerService.createCustomers({
        email: creationEmail,
        metadata: {
          email_verified: authVerified,
          email_verification_required: !authVerified,
        },
      })
      customer = created

      // Backfill customer_id on auth identity so tokens include it
      await authService.updateAuthIdentities({
        id: preFetchedAuthIdentity.id,
        app_metadata: {
          ...(preFetchedAuthIdentity.app_metadata ?? {}),
          customer_id: created.id,
        },
      })

      preFetchedAuthIdentity.app_metadata = {
        ...(preFetchedAuthIdentity.app_metadata ?? {}),
        customer_id: created.id,
      }
    } catch (e) {
      // If a customer already exists with this email, fetch it instead of failing.
      const existing = await customerService
        .listCustomers(
          { email: emailCandidates as any },
          { relations: [], take: 1 }
        )
        .then((r: any) => r?.[0])
        .catch(() => undefined)

      if (existing?.id) {
        customer = existing

        await authService.updateAuthIdentities({
          id: preFetchedAuthIdentity.id,
          app_metadata: {
            ...(preFetchedAuthIdentity.app_metadata ?? {}),
            customer_id: existing.id,
          },
        })

        preFetchedAuthIdentity.app_metadata = {
          ...(preFetchedAuthIdentity.app_metadata ?? {}),
          customer_id: existing.id,
        }
      } else {
        throw e
      }
    }
  }

  const isVerified = customerVerified || authVerified
  const requiresVerification =
    customerRequiresVerification || authRequiresVerification

  if (requiresVerification && !isVerified) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Please verify your email before signing in."
    )
  }

  const authData = {
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: { email: normalizedEmail || rawEmail, password },
    protocol: req.protocol,
  }

  const { success, error, authIdentity, location } =
    await authService.authenticate("emailpass", authData)

  if (location) {
    return res.status(200).json({ location })
  }

  if (success && authIdentity) {
    const { http } = config.projectConfig
    const token = buildTokenFromAuthIdentity(
      authIdentity,
      "customer",
      "emailpass",
      http
    )

    return res.status(200).json({ token })
  }

  throw new MedusaError(
    MedusaError.Types.UNAUTHORIZED,
    error || "Authentication failed"
  )
}
