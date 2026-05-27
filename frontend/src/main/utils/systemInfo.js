import { useQuery } from "react-query";
import axios from "axios";

export function useSystemInfo() {
  return useQuery(
    "systemInfo",
    async () => {
      try {
        const response = await axios.get("/api/systemInfo");
        return response.data;
      } catch (e) {
        console.error("Error invoking axios.get: ", e);
        if (e.response?.status === 404) {
          return {};
        }
        throw e;
      }
    },
    {
      placeholderData: {
        springH2ConsoleEnabled: false,
        showSwaggerUILink: false,
      },
    },
  );
}
