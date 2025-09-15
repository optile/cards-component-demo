import type {
  ListSessionRequest,
  ListSessionResponse,
} from "../types/checkout";
import { API_ENDPOINTS, DEFAULT_LIST_REQUEST } from "../constants/checkout";

export class CheckoutApiService {
  static async generateListSession(
    listRequest: ListSessionRequest = DEFAULT_LIST_REQUEST
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
}
