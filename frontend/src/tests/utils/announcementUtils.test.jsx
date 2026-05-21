import mockConsole from "tests/testutils/mockConsole";
import { vi } from "vitest";
import {
  onDeleteSuccess,
  cellToAxiosParamsDelete,
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
  beforeEach(() => {
    mockToast.mockClear();
  });

  describe("onDeleteSuccess", () => {
    test("logs the backend message and shows the fixed delete toast", () => {
      const restoreConsole = mockConsole();

      onDeleteSuccess("Server says announcement 123 was deleted");

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "Server says announcement 123 was deleted",
      );
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith("Announcement deleted");

      restoreConsole();
    });
  });

  describe("cellToAxiosParamsDelete", () => {
    test("returns the correct axios params for deleting row id 1", () => {
      const cell = { row: { values: { id: 1 } } };

      const result = cellToAxiosParamsDelete(cell);

      expect(result).toEqual({
        url: "/api/announcements/delete",
        method: "DELETE",
        params: { id: 1 },
      });
    });

    test("uses the id from the table cell row values", () => {
      const cell = { row: { values: { id: 42 } } };

      const result = cellToAxiosParamsDelete(cell);

      expect(result.url).toBe("/api/announcements/delete");
      expect(result.method).toBe("DELETE");
      expect(result.params).toEqual({ id: 42 });
    });
  });
});