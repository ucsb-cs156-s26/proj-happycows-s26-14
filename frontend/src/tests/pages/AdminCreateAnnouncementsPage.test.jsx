import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import AdminCreateAnnouncementsPage from "main/pages/AdminCreateAnnouncementsPage";
import AdminAnnouncementsPage from "main/pages/AdminAnnouncementsPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { vi } from "vitest";

const mockedNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useParams: () => ({
    commonsId: 1,
  }),
  useNavigate: () => mockedNavigate,
}));

vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

describe("AdminCreateAnnouncementsPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testId = "AnnouncementForm";

  const renderComponent = () => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminCreateAnnouncementsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    mockedNavigate.mockClear();
    mockToast.mockClear();

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    axiosMock.onGet("/api/commons/plus", { params: { id: 1 } }).reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
      totalPlayers: 5,
      totalCows: 5,
    });
  });

  test("renders page with commons name", async () => {
    renderComponent();

    expect(await screen.findByText("Create Announcement")).toBeInTheDocument();
    expect(
      await screen.findByText("for Commons Sample Commons"),
    ).toBeInTheDocument();

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("correct href for create announcements button as an admin", async () => {
    const queryClient = new QueryClient();

    axiosMock.onGet("/api/commons/plus", { params: { id: 1 } }).reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });
    axiosMock
      .onGet("/api/announcements/getbycommonsid", { params: { commonsId: 1 } })
      .reply(200, {
        content: [],
      });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminAnnouncementsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const createButton = await screen.findByText("Create Announcement");
    expect(createButton).toHaveAttribute(
      "href",
      "/admin/announcements/1/create",
    );
  });

  test("when all fields are filled in and submitted, the right POST request is sent", async () => {
    axiosMock.onPost("/api/announcements/post").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30:00",
      endDate: "2026-05-21T12:30:00",
      announcementText: "Full announcement",
    });

    renderComponent();

    await screen.findByText("Create Announcement");

    fireEvent.change(screen.getByTestId(`${testId}-startDate`), {
      target: { value: "2026-05-20T12:30" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-endDate`), {
      target: { value: "2026-05-21T12:30" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Full announcement" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.post.length).toBe(1));
    expect(axiosMock.history.post[0].url).toBe("/api/announcements/post");
    expect(axiosMock.history.post[0].params).toEqual({
      commonsId: 1,
      endDate: "2026-05-21T12:30",
      announcementText: "Full announcement",
      startDate: "2026-05-20T12:30",
    });

    expect(mockToast).toHaveBeenCalledWith("New Announcement Created - id: 17");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });

  test("when startDate and endDate are blank, startDate is omitted and endDate is null", async () => {
    axiosMock.onPost("/api/announcements/post").reply(200, {
      id: 18,
      commonsId: 1,
      startDate: null,
      endDate: null,
      announcementText: "No date announcement",
    });

    renderComponent();

    await screen.findByText("Create Announcement");

    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "No date announcement" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.post.length).toBe(1));
    expect(axiosMock.history.post[0].url).toBe("/api/announcements/post");
    expect(axiosMock.history.post[0].params).toEqual({
      commonsId: 1,
      endDate: null,
      announcementText: "No date announcement",
    });
    expect(axiosMock.history.post[0].params).not.toHaveProperty("startDate");

    expect(mockToast).toHaveBeenCalledWith("New Announcement Created - id: 18");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });

  test("does not send POST request when announcement text is missing", async () => {
    axiosMock.onPost("/api/announcements/post").reply(200, {});

    renderComponent();

    await screen.findByText("Create Announcement");

    fireEvent.change(screen.getByTestId(`${testId}-startDate`), {
      target: { value: "2026-05-20T12:30" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Announcement is required."),
    ).toBeInTheDocument();
    expect(axiosMock.history.post.length).toBe(0);
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});