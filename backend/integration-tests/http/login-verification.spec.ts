import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { generateJwtToken } from "@medusajs/framework/utils"

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://medusa_user:medusa_pass@localhost:5432/resend_p"

jest.setTimeout(90 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
  },
  testSuite: ({ api, getContainer }) => {
    describe("Customer email verification gate", () => {
      const rawEmail = "TestUser@example.com"
      const email = rawEmail.toLowerCase()
      const password = "Test1234!"

      it("blocks login before verification and allows after verifying", async () => {
        const registerRes = await api.post(
          "/auth/customer/emailpass/register",
          {
            email: rawEmail,
            password,
          }
        )

        expect(registerRes.status).toBe(200)
        const token = registerRes.data?.token as string
        expect(token).toBeTruthy()

        const customerRes = await api.post(
          "/store/customers",
          {
            email: rawEmail,
            first_name: "Test",
            last_name: "User",
            metadata: {
              email_verification_required: true,
              email_verified: false,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        expect(customerRes.status).toBe(200)

        // Unverified login must fail
        let failedLoginStatus = 0
        try {
          await api.post("/store/customers/login", { email, password })
        } catch (err: any) {
          failedLoginStatus = err?.response?.status
          expect(err?.response?.data?.message).toMatch(/verify your email/i)
        }
        expect(failedLoginStatus).toBe(401)

        // Build verification token the same way as the send-verification route
        const container = getContainer()
        const config = container.resolve("configModule")
        const { http } = config.projectConfig

        const verificationToken = generateJwtToken(
          {
            entity_id: email,
            provider: "emailpass",
            actor_type: "customer",
            purpose: "email_verification",
          },
          {
            secret: http.jwtSecret,
            expiresIn: "24h",
            jwtOptions: http.jwtOptions,
          }
        )

        const verifyRes = await api.post("/store/customers/verify-email", {
          token: verificationToken,
        })
        expect(verifyRes.status).toBe(200)

        // Verified login should now succeed
        const loginRes = await api.post("/store/customers/login", {
          email,
          password,
        })

        expect(loginRes.status).toBe(200)
        expect(loginRes.data?.token).toBeTruthy()
      })
    })
  },
})
