import type {
  ListSessionRequest,
  ListSessionResponse,
} from "../types/checkout";
import { API_ENDPOINTS } from "../constants/checkout";

export class CheckoutApiService {
  static async generateListSession(
    listRequest: ListSessionRequest
  ): Promise<ListSessionResponse> {
    const response = await fetch(API_ENDPOINTS.LIST_SESSION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(listRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ListSessionResponse;
    return data;
  }

  static async updateListSession(
    listId: string,
    listRequest: ListSessionRequest
  ) {
    return fetch(`${API_ENDPOINTS.LIST_SESSION}/${listId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ...listRequest }),
    });
  }
}
