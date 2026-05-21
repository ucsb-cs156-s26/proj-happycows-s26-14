import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router";
import AnnouncementForm from "main/components/Announcement/AnnouncementForm";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => ({
  ...(await vi.importActual("react-router")),
  useNavigate: () => mockedNavigate,
}));

describe("AnnouncementForm tests", () => {
  const testId = "AnnouncementForm";

  const renderComponent = (props = {}) => {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <Router>
          <AnnouncementForm {...props} />
        </Router>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    mockedNavigate.mockClear();
  });

  test("renders correctly with no initialContents", async () => {
    renderComponent();

    expect(await screen.findByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("End Date")).toBeInTheDocument();
    expect(screen.getByText("Announcement")).toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-startDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-endDate`)).toHaveValue("");
    expect(screen.getByTestId(`${testId}-announcementText`)).toHaveValue("");
    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent("Create");
    expect(screen.getByTestId(`${testId}-cancel`)).toHaveTextContent("Cancel");
  });

  test("renders correctly with initialContents and custom buttonLabel", async () => {
    const initialContents = {
      id: 17,
      startDate: "2026-05-20T12:30",
      endDate: "2026-05-21T13:45",
      announcementText: "Existing announcement",
    };

    renderComponent({
      initialContents,
      buttonLabel: "Update",
    });

    expect(await screen.findByTestId(`${testId}-id`)).toBeInTheDocument();
    expect(screen.getByText("Id")).toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-id`)).toHaveValue("17");
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
  });

  test("that navigate(-1) is called when Cancel is clicked", async () => {
    renderComponent();

    const cancelButton = await screen.findByTestId(`${testId}-cancel`);
    fireEvent.click(cancelButton);

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith(-1));
  });

  test("that announcementText is required", async () => {
    const submitAction = vi.fn();

    renderComponent({ submitAction });

    fireEvent.click(await screen.findByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Announcement is required."),
    ).toBeInTheDocument();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("submits the correct data when every field is provided", async () => {
    const submitAction = vi.fn();

    renderComponent({ submitAction });

    fireEvent.change(screen.getByTestId(`${testId}-startDate`), {
      target: { value: "2026-05-20T12:30" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-endDate`), {
      target: { value: "2026-05-21T13:45" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Full announcement" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction).toHaveBeenCalledWith(
      {
        startDate: "2026-05-20T12:30",
        endDate: "2026-05-21T13:45",
        announcementText: "Full announcement",
      },
      expect.anything(),
    );
  });

  test("shows validation error when startDate is not in ISO format", async () => {
    const submitAction = vi.fn();

    renderComponent({ submitAction });

    const startDateInput = screen.getByTestId(`${testId}-startDate`);
    const announcementTextInput = screen.getByTestId(
      `${testId}-announcementText`,
    );
    const submitButton = screen.getByTestId(`${testId}-submit`);

    startDateInput.setAttribute("type", "text");

    fireEvent.change(startDateInput, {
      target: { value: "not-a-date" },
    });

    fireEvent.change(announcementTextInput, {
      target: { value: "Valid announcement text" },
    });

    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Start Date must be provided in ISO format."),
    ).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("startDate and endDate are optional when announcementText is provided", async () => {
    const submitAction = vi.fn();

    renderComponent({ submitAction });

    fireEvent.change(screen.getByTestId(`${testId}-announcementText`), {
      target: { value: "Announcement with no dates" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction).toHaveBeenCalledWith(
      {
        startDate: "",
        endDate: "",
        announcementText: "Announcement with no dates",
      },
      expect.anything(),
    );
  });
});
