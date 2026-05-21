import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import AdminEditAnnouncementsPage from "main/pages/AdminEditAnnouncementsPage";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { vi } from "vitest";

const mockedNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useParams: () => ({
    commonsId: 1,
    id: 17,
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

describe("AdminEditAnnouncementsPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testId = "AnnouncementForm";

  const renderComponent = () => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminEditAnnouncementsPage />
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

  test("renders page with commons name and cleaned date values", async () => {
    axiosMock
      .onGet("/api/announcements/getbyid", { params: { id: 17 } })
      .reply(200, {
        id: 999,
        commonsId: 1,
        startDate: "2026-05-20T12:30:45.000Z",
        endDate: "2026-05-21T13:45:45.000Z",
        announcementText: "Existing announcement",
      });

    renderComponent();

    expect(await screen.findByText("Edit Announcement")).toBeInTheDocument();
    expect(
      await screen.findByText("for Commons Sample Commons"),
    ).toBeInTheDocument();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("999");
    expect(screen.getByTestId(`${testId}-id`)).toBeDisabled();
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue(
      "2026-05-20T12:30",
    );
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue(
      "2026-05-21T13:45",
    );
    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Existing announcement",
    );
    expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent("Update");

    const announcementGet = axiosMock.history.get.find(
      (x) => x.url === "/api/announcements/getbyid",
    );
    expect(announcementGet.params).toEqual({ id: 17 });

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("renders blank date inputs when existing dates are null", async () => {
    axiosMock
      .onGet("/api/announcements/getbyid", { params: { id: 17 } })
      .reply(200, {
        id: 17,
        commonsId: 1,
        startDate: null,
        endDate: null,
        announcementText: "Existing announcement with no dates",
      });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Existing announcement with no dates",
    );
  });

  test("submitting edit uses id from URL params, not the disabled form id", async () => {
    axiosMock
      .onGet("/api/announcements/getbyid", { params: { id: 17 } })
      .reply(200, {
        id: 999,
        commonsId: 1,
        startDate: "2026-05-20T12:30:45.000Z",
        endDate: null,
        announcementText: "Existing announcement",
      });
    axiosMock.onPut("/api/announcements/put").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30:00",
      endDate: null,
      announcementText: "Updated announcement",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-announcementText`)).toHaveValue(
      "Existing announcement",
    );
    expect(screen.getByTestId(`${testId}-id`)).toHaveValue("999");
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue("");

    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Updated announcement" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    expect(axiosMock.history.put[0].url).toBe("/api/announcements/put");
    expect(axiosMock.history.put[0].params).toEqual({
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30",
      endDate: null,
      announcementText: "Updated announcement",
    });

    expect(mockToast).toHaveBeenCalledWith("Announcement Updated - id: 17");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });

  test("submitting edit sends nonblank endDate when provided", async () => {
    axiosMock
      .onGet("/api/announcements/getbyid", { params: { id: 17 } })
      .reply(200, {
        id: 17,
        commonsId: 1,
        startDate: "2026-05-20T12:30:45.000Z",
        endDate: "2026-05-21T13:45:45.000Z",
        announcementText: "Existing announcement",
      });
    axiosMock.onPut("/api/announcements/put").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30:00",
      endDate: "2026-05-22T14:15:00",
      announcementText: "Updated announcement with end date",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-endDate`)).toHaveValue(
      "2026-05-21T13:45",
    );

    fireEvent.change(screen.getByTestId(`${testId}-endDate`), {
      target: { value: "2026-05-22T14:15" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Updated announcement with end date" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));
    expect(axiosMock.history.put[0].params).toEqual({
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30",
      endDate: "2026-05-22T14:15",
      announcementText: "Updated announcement with end date",
    });

    expect(mockToast).toHaveBeenCalledWith("Announcement Updated - id: 17");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });

  test("does not send PUT request when announcement text is missing", async () => {
    axiosMock
      .onGet("/api/announcements/getbyid", { params: { id: 17 } })
      .reply(200, {
        id: 17,
        commonsId: 1,
        startDate: "2026-05-20T12:30:45.000Z",
        endDate: null,
        announcementText: "",
      });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-announcementText`)).toHaveValue(
      "",
    );

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Announcement is required."),
    ).toBeInTheDocument();
    expect(axiosMock.history.put.length).toBe(0);
    expect(mockToast).not.toHaveBeenCalled();
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});