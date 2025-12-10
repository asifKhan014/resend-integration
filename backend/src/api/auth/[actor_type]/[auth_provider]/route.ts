import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  generateJwtToken,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

const isCustomerEmailPass = (actorType?: string, provider?: string) =>
  actorType === "customer" && provider === "emailpass"

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

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { actor_type, auth_provider } = req.params
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
  const service = req.scope.resolve(Modules.AUTH)

  // Pre-check: block unverified customers by email before authenticating
  if (
    isCustomerEmailPass(actor_type, auth_provider) &&
    typeof req.body?.email === "string"
  ) {
    const email = (req.body.email as string).toLowerCase().trim()
    if (email) {
      try {
        const remoteQuery = req.scope.resolve(
          ContainerRegistrationKeys.REMOTE_QUERY
        )
        const query = remoteQueryObjectFromString({
          entryPoint: "customer",
          variables: {
            filters: { email },
            take: 1,
          },
          fields: ["id", "metadata"],
        })

        const { rows } = await remoteQuery(query)
        const customer = rows?.[0]
        const requiresVerification =
          customer?.metadata?.email_verification_required !== false
        const isVerified = customer?.metadata?.email_verified === true

        req.scope
          .resolve("logger")
          .info(
            `[auth-precheck] email=${email} customer_found=${!!customer} requires=${requiresVerification} verified=${isVerified}`
          )

        if ((!customer || requiresVerification) && !isVerified) {
          throw new MedusaError(
            MedusaError.Types.UNAUTHORIZED,
            "Please verify your email before signing in."
          )
        }
      } catch (err) {
        // On any failure in verification lookup, block defensively
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "Please verify your email before signing in."
        )
      }
    }
  }

  const authData = {
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    protocol: req.protocol,
  }

  const { success, error, authIdentity, location } =
    await service.authenticate(auth_provider, authData)

  if (location) {
    return res.status(200).json({ location })
  }

  if (success && authIdentity) {
    req.scope
      .resolve("logger")
      .info(
        `Custom auth route hit for ${actor_type}/${auth_provider} (auth_identity_id=${authIdentity.id})`
      )

    if (isCustomerEmailPass(actor_type, auth_provider)) {
      let requiresVerification = true
      let isVerified = false

      const providerIdentity = authIdentity.provider_identities?.find(
        (identity: any) => identity.provider === auth_provider
      )
      const email = providerIdentity?.entity_id?.toLowerCase()

      if (email) {
        const remoteQuery = req.scope.resolve(
          ContainerRegistrationKeys.REMOTE_QUERY
        )
        const query = remoteQueryObjectFromString({
          entryPoint: "customer",
          variables: {
            filters: { email },
            take: 1,
          },
          fields: ["id", "metadata"],
        })

        const { rows } = await remoteQuery(query)
        const customer = rows?.[0]

        if (customer?.metadata?.email_verification_required === false) {
          requiresVerification = false
        }

        isVerified = customer?.metadata?.email_verified === true
      } else {
        // If we somehow don't have an email from the provider, block login defensively.
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "Email is missing on the account. Please verify your email before signing in."
        )
      }

      if (requiresVerification && !isVerified) {
        req.scope.resolve("logger").info(
          `Blocking login for unverified customer ${email ?? "unknown"}`
        )
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "Please verify your email before signing in."
        )
      }
    }

    const { http } = config.projectConfig
    const token = buildTokenFromAuthIdentity(
      authIdentity,
      actor_type,
      auth_provider,
      http
    )

    return res.status(200).json({ token })
  }

  throw new MedusaError(
    MedusaError.Types.UNAUTHORIZED,
    error || "Authentication failed"
  )
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  return GET(req, res)
}
