import { setIdentityTransport } from "@workspace/api-client-react";
import { httpClient } from "./httpClient";

setIdentityTransport(async (config) => {
  const response = await httpClient.request(config);
  return response.data;
});
