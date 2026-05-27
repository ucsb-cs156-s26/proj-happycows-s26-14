import mockConsole from "tests/testutils/mockConsole";
import { vi } from "vitest";
import {
  onDeleteSuccess,
  cellToAxiosParamsDelete,
  toBackendDateTime,
  formatAnnouncementDateTime,
} from "main/utils/announcementUtils";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

describe("AnnouncementUtils", () => {
  describe("onDeleteSuccess", () => {
    test("It puts the message on console.log and in a toast", () => {
      // arrange
      const restoreConsole = mockConsole();

      // act
      onDeleteSuccess({ id: 17 });

      // assert
      expect(mockToast).toHaveBeenCalledWith("Announcement deleted - id: 17");
      expect(console.log).toHaveBeenCalled();
      const message = console.log.mock.calls[0][0];
      expect(message).toEqual({ id: 17 });

      restoreConsole();
    });
  });
  describe("cellToAxiosParamsDelete", () => {
    test("It returns the correct params", () => {
      // arrange
      const cell = { row: { values: { id: 1 } } };

      // act
      const result = cellToAxiosParamsDelete(cell);

      // assert
      expect(result).toEqual({
        url: "/api/announcements/delete",
        method: "DELETE",
        params: { id: 1 },
      });
    });
  });
  describe("toBackendDateTime", () => {
    test("It returns undefined for blank values", () => {
      expect(toBackendDateTime()).toBeUndefined();
      expect(toBackendDateTime("")).toBeUndefined();
    });

    test("It formats an AM date for the backend", () => {
      expect(toBackendDateTime("2004-12-10T00:12")).toBe(
        new Date("2004-12-10T00:12").toISOString(),
      );
    });

    test("It formats a PM date for the backend", () => {
      expect(toBackendDateTime("2004-12-10T13:45")).toBe(
        new Date("2004-12-10T13:45").toISOString(),
      );
    });

    test("It sends an ISO instant instead of a timezone-less display string", () => {
      const result = toBackendDateTime("2004-12-10T10:00");

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result).not.toContain("Dec");
      expect(result).not.toContain("AM");
    });
  });
  describe("formatAnnouncementDateTime", () => {
    test("It formats dates up to the minute", () => {
      const result = formatAnnouncementDateTime("2024-12-12T03:04:05.678");

      expect(result).toContain("3:04");
      expect(result).not.toContain(":05");
      expect(result).not.toContain("678");
    });

    test("It returns blank for missing dates", () => {
      expect(formatAnnouncementDateTime()).toBe("");
      expect(formatAnnouncementDateTime(null)).toBe("");
    });
  });
});
