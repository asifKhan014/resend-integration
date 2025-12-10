import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

async function enforceCustomerVerification(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const method = req.method?.toUpperCase() || ""
  const path = req.url || ""

  // Only target customer email/password logins (POST or GET)
  if (
    !path.startsWith("/auth/customer/emailpass") ||
    (method !== "POST" && method !== "GET")
  ) {
    return next()
  }

  const email =
    (req.body?.email as string | undefined)?.toLowerCase()?.trim() ||
    (req.query?.email as string | undefined)?.toLowerCase()?.trim()

  if (!email) {
    // Let the auth route handle missing email/password validation
    req.scope
      .resolve("logger")
      .info("[enforceCustomerVerification] missing email, skipping")
    return next()
  }

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

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

  // If customer exists and verification required but not completed, block login.
  const requiresVerification =
    customer?.metadata?.email_verification_required !== false
  const isVerified = customer?.metadata?.email_verified === true

  req.scope
    .resolve("logger")
    .info(
      `[enforceCustomerVerification] email=${email} customer_found=${!!customer} requires=${requiresVerification} verified=${isVerified}`
    )

  if (customer && requiresVerification && !isVerified) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Please verify your email before signing in."
    )
  }

  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/auth/:actor_type/:auth_provider",
      middlewares: [enforceCustomerVerification],
    },
  ],
})
