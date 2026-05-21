import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import AdminAnnouncementsPage from "main/pages/AdminAnnouncementsPage";
import AdminListCommonsPage from "main/pages/AdminListCommonPage";
import commonsPlusFixtures from "fixtures/commonsPlusFixtures";
import { announcementFixtures } from "fixtures/announcementFixtures";
import { vi } from "vitest";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useParams: () => ({
    commonsId: 1,
  }),
  useNavigate: () => mockedNavigate,
}));

describe("AdminAnnouncementsPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const renderComponent = () => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminAnnouncementsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  test("renders page without crashing", async () => {
    axiosMock.onGet("/api/commons/plus", { params: { id: 1 } }).reply(200, {
      commons: { id: 1, name: "Sample Commons" },
    });
    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200, {
      content: [],
    });

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons: Sample Commons"),
    ).toBeInTheDocument();
  });

  test("renders announcements with correct commons name", async () => {
    axiosMock.onGet("/api/commons/plus", { params: { id: 1 } }).reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
      totalPlayers: 5,
      totalCows: 5,
    });
    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200, {
      content: announcementFixtures.threeAnnouncements,
    });

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons: Sample Commons"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("AnnouncementTable-cell-row-0-col-id"),
    ).toHaveTextContent("1");
    expect(
      screen.getByTestId("AnnouncementTable-cell-row-1-col-announcementText"),
    ).toHaveTextContent("This is a test announcement for commons id 1");
    const announcementsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbycommonsid",
    );
    expect(announcementsGet.params).toEqual({ commonsId: 1 });
  });

  test("correct href for announcements button as an admin", async () => {
    const testId = "CommonsTable";
    const queryClient = new QueryClient();
    axiosMock
      .onGet("/api/commons/allplus")
      .reply(200, commonsPlusFixtures.threeCommonsPlus);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminListCommonsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByTestId(`${testId}-cell-row-0-col-commons.id`),
    ).toHaveTextContent("1");

    const announcementsButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Announcements-button`,
    );
    expect(announcementsButton).toHaveAttribute(
      "href",
      "/admin/announcements/1",
    );
  });
});
