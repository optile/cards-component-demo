import type {
  ListSessionRequest,
  ListSessionResponse,
} from "@/features/embeddedCheckout/types/checkout";
import { getApiEndpoints } from "@/features/embeddedCheckout/constants/checkout";

export class CheckoutApiService {
  static async generateListSession(
    listRequest: ListSessionRequest,
    env: string
  ): Promise<ListSessionResponse> {
    const API_ENDPOINTS = getApiEndpoints(env);
    const response = await fetch(API_ENDPOINTS.LIST_SESSION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ...listRequest }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ListSessionResponse;
    return data;
  }

  static async updateListSession(
    listId: string,
    listRequest: ListSessionRequest,
    env: string
  ) {
    const API_ENDPOINTS = getApiEndpoints(env);
    return fetch(`${API_ENDPOINTS.LIST_SESSION}/${listId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ...listRequest, style: { language: "de_DE" } }),
    });
  }
}
