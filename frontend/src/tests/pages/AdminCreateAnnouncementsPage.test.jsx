import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import AdminCreateAnnouncementsPage from "main/pages/AdminCreateAnnouncementsPage";
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
  });

  test("renders without crashing with commons name", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    renderComponent();

    expect(await screen.findByText("Create Announcement")).toBeInTheDocument();
    expect(screen.getByText("for Commons Sample Commons")).toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-startDate`)).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-endDate`)).toBeInTheDocument();
    expect(
      screen.getByTestId(`${testId}-announcementText`),
    ).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-submit`)).toBeInTheDocument();

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("renders even when commonsPlus has no commons object", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {});

    renderComponent();

    expect(await screen.findByText("Create Announcement")).toBeInTheDocument();
    expect(screen.getByText("for Commons")).toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-startDate`)).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-endDate`)).toBeInTheDocument();
    expect(
      screen.getByTestId(`${testId}-announcementText`),
    ).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-submit`)).toBeInTheDocument();

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("submitting with all fields sends correct post params and redirects", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onPost("/api/announcements/post").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30:00",
      endDate: "2026-05-21T12:30:00",
      announcementText: "Full announcement",
    });

    renderComponent();

    expect(await screen.findByText("Create Announcement")).toBeInTheDocument();

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

  test("when startDate is blank, startDate is omitted from request params and endDate becomes null", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onPost("/api/announcements/post").reply(200, {
      id: 18,
      commonsId: 1,
      announcementText: "No start date announcement",
    });

    renderComponent();

    expect(await screen.findByText("Create Announcement")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "No start date announcement" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.post.length).toBe(1));

    expect(axiosMock.history.post[0].url).toBe("/api/announcements/post");

    expect(axiosMock.history.post[0].params).toEqual({
      commonsId: 1,
      endDate: null,
      announcementText: "No start date announcement",
    });

    expect(axiosMock.history.post[0].params).not.toHaveProperty("startDate");
    expect(mockToast).toHaveBeenCalledWith("New Announcement Created - id: 18");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });
});
