import { render, screen, waitFor } from "@testing-library/react";
import Profits from "main/components/Commons/Profits";
import { QueryClient, QueryClientProvider } from "react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { vi } from "vitest";

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useParams: () => ({
    commonsId: 1,
  }),
}));

describe("Profits tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const queryClient = new QueryClient();

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock.onGet("/api/profits/paged/commonsid").reply(200, {
      content: [],
      totalPages: 0,
    });
  });

  test("renders properly when profits is not given", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Profits />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("PagedProfitsTable-header-amount"),
      ).toBeInTheDocument();
    });
  });
});
