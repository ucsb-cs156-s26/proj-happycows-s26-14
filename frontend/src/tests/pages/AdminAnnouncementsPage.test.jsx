import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  const testId = "AnnouncementTable";

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
    mockedNavigate.mockClear();

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  test("renders page without crashing when there are no announcements", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200, {
      content: [],
    });

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons: Sample Commons"),
    ).toBeInTheDocument();

    expect(screen.getByText("Create Announcement")).toHaveAttribute(
      "href",
      "/admin/announcements/1/create",
    );

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("Start Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("End Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });

    const announcementsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbycommonsid",
    );
    expect(announcementsGet.params).toEqual({ commonsId: 1 });
  });

  test("renders announcements with correct commons name and admin buttons", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
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
      await screen.findByTestId(`${testId}-cell-row-0-col-id`),
    ).toHaveTextContent("1");

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-startDate`),
    ).toHaveTextContent("2024-12-12T00:00:00");

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-endDate`),
    ).toHaveTextContent("2025-12-12T00:00:00");

    expect(
      screen.getByTestId(`${testId}-cell-row-1-col-announcementText`),
    ).toHaveTextContent("This is a test announcement for commons id 1");

    const editButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Edit-button`,
    );
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveClass("btn-primary");

    const deleteButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveClass("btn-danger");

    fireEvent.click(editButton);

    await waitFor(() =>
      expect(mockedNavigate).toHaveBeenCalledWith(
        "/admin/announcements/1/edit/1",
      ),
    );

    const announcementsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbycommonsid",
    );
    expect(announcementsGet.params).toEqual({ commonsId: 1 });
  });

  test("renders empty announcements table when announcementsPage content is missing", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200, {});

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons: Sample Commons"),
    ).toBeInTheDocument();

    expect(screen.getByText("Create Announcement")).toHaveAttribute(
      "href",
      "/admin/announcements/1/create",
    );

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("Start Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("End Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();

    const announcementsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbycommonsid",
    );
    expect(announcementsGet.params).toEqual({ commonsId: 1 });
  });

  test("renders even when commonsPlus has no commons object", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {});

    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200, {
      content: [],
    });

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons:"),
    ).toBeInTheDocument();

    expect(screen.getByText("Create Announcement")).toHaveAttribute(
      "href",
      "/admin/announcements/1/create",
    );

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("Start Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("End Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("correct href for announcements button as an admin on commons list page", async () => {
    const queryClient = new QueryClient();
    const commonsTableTestId = "CommonsTable";

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
      await screen.findByTestId(
        `${commonsTableTestId}-cell-row-0-col-commons.id`,
      ),
    ).toHaveTextContent("1");

    const announcementsButton = screen.getByTestId(
      `${commonsTableTestId}-cell-row-0-col-Announcements-button`,
    );

    expect(announcementsButton).toHaveAttribute(
      "href",
      "/admin/announcements/1",
    );
  });

  test("renders empty announcements table when announcementsPage is undefined", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    // This intentionally returns 200 with no response body.
    // That makes announcementsPage become undefined after the backend call finishes.
    axiosMock.onGet("/api/announcements/getbycommonsid").reply(200);

    renderComponent();

    expect(
      await screen.findByText("Announcements for Commons: Sample Commons"),
    ).toBeInTheDocument();

    expect(screen.getByText("Create Announcement")).toHaveAttribute(
      "href",
      "/admin/announcements/1/create",
    );

    expect(screen.getByText("id")).toBeInTheDocument();
    expect(screen.getByText("Start Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("End Date ISO Format")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();

    const announcementsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbycommonsid",
    );
    expect(announcementsGet.params).toEqual({ commonsId: 1 });
  });
});
