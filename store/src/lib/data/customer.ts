"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(_currentState: unknown, formData: FormData) {
  const password = formData.get("password") as string
  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const customerForm = {
    email,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    const authHeader = {
      authorization: `Bearer ${token}`,
    }

    await sdk.store.customer.create(
      {
        ...customerForm,
        metadata: {
          email_verification_required: true,
          email_verified: false,
        },
      },
      {},
      authHeader
    )

    // Fire-and-forget; this route responds 200 even if email doesn't exist.
    try {
      await sdk.client.fetch(`/store/customers/send-verification`, {
        method: "POST",
        headers: {
          ...authHeader,
          "content-type": "application/json",
        },
        body: {
          email: customerForm.email,
        },
      })
    } catch (e) {
      // ignore, user can request another email from the verify page
    }

    await removeAuthToken()

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.toString() }
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const password = formData.get("password") as string

  try {
    const { token } = await sdk.client.fetch<{ token: string }>(
      "/store/customers/login",
      {
        method: "POST",
        body: { email, password },
      }
    )

    await setAuthToken(token as string)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
  } catch (error: any) {
    if (error?.response?.data?.message) {
      return error.response.data.message
    }
    return error.toString()
  }

  try {
    await transferCart()
  } catch (error: any) {
    return error.toString()
  }
}

export const requestPasswordReset = async (
  _currentState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const email =
    ((formData.get("email") as string | null)?.trim().toLowerCase()) || ""

  if (!email) {
    return { success: false, error: "Please enter the email on your account." }
  }

  try {
    await sdk.auth.resetPassword("customer", "emailpass", {
      identifier: email,
    })

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error:
        error?.message ||
        "We couldn't request a password reset right now. Please try again.",
    }
  }
}

export const resetPasswordWithToken = async (
  _currentState: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> => {
  const token = (formData.get("token") as string | null)?.trim()
  const email =
    ((formData.get("email") as string | null)?.trim().toLowerCase()) || ""
  const password = (formData.get("password") as string | null) || ""
  const confirmPassword =
    (formData.get("confirm_password") as string | null) || ""

  if (!token) {
    return {
      success: false,
      error:
        "The reset link is missing a token. Request a new email to try again.",
    }
  }

  if (!email) {
    return {
      success: false,
      error:
        "We couldn't find an email on this link. Open the reset link from your email again.",
    }
  }

  if (!password || !confirmPassword) {
    return {
      success: false,
      error: "Enter and confirm your new password to continue.",
    }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  try {
    await sdk.client.fetch(`/auth/customer/emailpass/update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        email,
        password,
      },
    })

    return { success: true, error: null }
  } catch (error: any) {
    return {
      success: false,
      error:
        error?.message ||
        "We couldn't reset your password. Request a new link and try again.",
    }
  }
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
