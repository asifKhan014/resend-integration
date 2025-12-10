import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgres://medusa_user:medusa_pass@localhost:5432/resend_p"
jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
  },
  testSuite: ({ api }) => {
    describe("Ping", () => {
      it("ping the server health endpoint", async () => {
        const response = await api.get('/health')
        expect(response.status).toEqual(200)
      })
    })
  },
})
