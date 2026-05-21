import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { announcementFixtures } from "fixtures/announcementFixtures";
import AnnouncementTable from "main/components/Announcement/AnnouncementTable";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { vi } from "vitest";

const mockedNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
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

describe("AnnouncementTable tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const expectedHeaders = [
    "id",
    "Start Date ISO Format",
    "End Date ISO Format",
    "Announcement",
  ];
  const expectedFields = ["id", "startDate", "endDate", "announcementText"];
  const testId = "AnnouncementTable";

  const renderComponent = ({ announcements, currentUser }) => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AnnouncementTable
            announcements={announcements}
            currentUser={currentUser}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    axiosMock.reset();
    axiosMock.resetHistory();
    mockedNavigate.mockClear();
    mockToast.mockClear();
  });

  test("renders empty table correctly for admin user", () => {
    renderComponent({
      announcements: [],
      currentUser: currentUserFixtures.adminUser,
    });

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-${field}`),
      ).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Edit")).toBeInTheDocument();
    expect(screen.queryByText("Delete")).toBeInTheDocument();
  });

  test("has the expected column headers, content, and buttons for admin user", () => {
    renderComponent({
      announcements: announcementFixtures.threeAnnouncements,
      currentUser: currentUserFixtures.adminUser,
    });

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      expect(
        screen.getByTestId(`${testId}-cell-row-0-col-${field}`),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId(`${testId}-cell-row-0-col-id`)).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-startDate`),
    ).toHaveTextContent("2024-12-12T00:00:00");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-endDate`),
    ).toHaveTextContent("2025-12-12T00:00:00");

    expect(screen.getByTestId(`${testId}-cell-row-1-col-id`)).toHaveTextContent(
      "2",
    );
    expect(
      screen.getByTestId(`${testId}-cell-row-1-col-startDate`),
    ).toHaveTextContent("2022-12-12T00:00:00");
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
  });

  test("has expected columns and no edit/delete buttons for ordinary user", () => {
    renderComponent({
      announcements: announcementFixtures.threeAnnouncements,
      currentUser: currentUserFixtures.userOnly,
    });

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      expect(
        screen.getByTestId(`${testId}-cell-row-0-col-${field}`),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId(`${testId}-cell-row-0-col-id`)).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-announcementText`),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  test("Edit button navigates to the edit page using commonsId and id", async () => {
    renderComponent({
      announcements: announcementFixtures.threeAnnouncements,
      currentUser: currentUserFixtures.adminUser,
    });

    const editButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Edit-button`,
    );

    fireEvent.click(editButton);

    await waitFor(() =>
      expect(mockedNavigate).toHaveBeenCalledWith(
        "/admin/announcements/1/edit/1",
      ),
    );
  });

  test("Delete button sends the correct delete request and shows success toast", async () => {
    axiosMock
      .onDelete("/api/announcements/delete", { params: { id: 1 } })
      .reply(200, "Announcement deleted");

    renderComponent({
      announcements: announcementFixtures.threeAnnouncements,
      currentUser: currentUserFixtures.adminUser,
    });

    const deleteButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );

    fireEvent.click(deleteButton);

    await waitFor(() => expect(axiosMock.history.delete.length).toBe(1));
    expect(axiosMock.history.delete[0].url).toBe("/api/announcements/delete");
    expect(axiosMock.history.delete[0].params).toEqual({ id: 1 });
    expect(mockToast).toHaveBeenCalledWith("Announcement deleted");
  });
});
