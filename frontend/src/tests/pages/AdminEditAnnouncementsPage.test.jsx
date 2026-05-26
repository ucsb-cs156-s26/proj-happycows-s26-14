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
  });

  test("renders header but form is not present until announcement is loaded", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").timeout();

    renderComponent();

    expect(await screen.findByText("Edit Announcement")).toBeInTheDocument();
    expect(screen.getByText("for Commons Sample Commons")).toBeInTheDocument();

    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`${testId}-submit`)).not.toBeInTheDocument();
  });

  test("renders page with commons name and cleaned date values", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 999,
      commonsId: 1,
      startDate: "2026-05-20T19:30:45.000Z",
      endDate: "2026-05-21T20:45:45.000Z",
      announcementText: "Existing announcement",
    });

    renderComponent();

    expect(await screen.findByText("Edit Announcement")).toBeInTheDocument();
    expect(screen.getByText("for Commons Sample Commons")).toBeInTheDocument();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("999");

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

  test("renders even when commonsPlus has no commons object", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {});

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T19:30:45.000Z",
      endDate: "2026-05-21T20:45:45.000Z",
      announcementText: "Existing announcement",
    });

    renderComponent();

    expect(await screen.findByText("Edit Announcement")).toBeInTheDocument();
    expect(screen.getByText("for Commons")).toBeInTheDocument();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");

    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue(
      "2026-05-20T12:30",
    );

    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue(
      "2026-05-21T13:45",
    );

    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Existing announcement",
    );

    const commonsGet = axiosMock.history.get.find(
      (x) => x.url === "/api/commons/plus",
    );
    expect(commonsGet.params).toEqual({ id: 1 });
  });

  test("blank startDate and endDate from backend are converted to empty form values", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: null,
      endDate: null,
      announcementText: "Announcement without dates",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue("");

    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Announcement without dates",
    );
  });

  test("date values without timezone are trimmed for datetime-local inputs", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T12:30:45",
      endDate: "2026-05-21T13:45:45",
      announcementText: "Announcement with local dates",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue(
      "2026-05-20T12:30",
    );
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue(
      "2026-05-21T13:45",
    );
    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Announcement with local dates",
    );
  });

  test("invalid timezone date values are converted to empty form values", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "not-a-dateZ",
      endDate: "also-not-a-date-07:00",
      announcementText: "Announcement with invalid dates",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue(
      "Announcement with invalid dates",
    );
  });

  test("timezone dates with hour 24 are normalized to hour 00", async () => {
    const dateTimeFormatSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(() => ({
        formatToParts: () => [
          { type: "month", value: "05" },
          { type: "literal", value: "/" },
          { type: "day", value: "20" },
          { type: "literal", value: "/" },
          { type: "year", value: "2026" },
          { type: "literal", value: ", " },
          { type: "hour", value: "24" },
          { type: "literal", value: ":" },
          { type: "minute", value: "05" },
        ],
      }));

    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T07:05:00.000Z",
      endDate: null,
      announcementText: "Announcement at midnight",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-id`)).toHaveValue("17");
    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue(
      "2026-05-20T00:05",
    );

    dateTimeFormatSpy.mockRestore();
  });

  test("submitting edit uses id from URL params, not the disabled form id", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 999,
      commonsId: 1,
      startDate: "2026-05-20T19:30:45.000Z",
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

    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue(
      "2026-05-20T12:30",
    );

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

  test("submitting edit sends changed startDate and endDate when both are provided", async () => {
    axiosMock.onGet("/api/commons/plus").reply(200, {
      commons: {
        id: 1,
        name: "Sample Commons",
      },
    });

    axiosMock.onGet("/api/announcements/getbyid").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-20T19:30:45.000Z",
      endDate: "2026-05-21T20:45:45.000Z",
      announcementText: "Existing announcement",
    });

    axiosMock.onPut("/api/announcements/put").reply(200, {
      id: 17,
      commonsId: 1,
      startDate: "2026-05-22T14:10:00",
      endDate: "2026-05-23T15:20:00",
      announcementText: "Updated with dates",
    });

    renderComponent();

    expect(await screen.findByTestId(`${testId}-announcementText`)).toHaveValue(
      "Existing announcement",
    );

    fireEvent.change(screen.getByTestId(`${testId}-startDate`), {
      target: { value: "2026-05-22T14:10" },
    });

    fireEvent.change(screen.getByTestId(`${testId}-endDate`), {
      target: { value: "2026-05-23T15:20" },
    });

    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Updated with dates" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(axiosMock.history.put.length).toBe(1));

    expect(axiosMock.history.put[0].params).toEqual({
      id: 17,
      commonsId: 1,
      startDate: "2026-05-22T14:10",
      endDate: "2026-05-23T15:20",
      announcementText: "Updated with dates",
    });

    expect(mockToast).toHaveBeenCalledWith("Announcement Updated - id: 17");
    expect(mockedNavigate).toHaveBeenCalledWith("/admin/announcements/1");
  });
});
