import { toast } from "react-toastify";

export function onDeleteSuccess(message) {
  console.log(message);
  toast(`Announcement deleted - id: ${message.id}`);
}

export function cellToAxiosParamsDelete(cell) {
  return {
    url: "/api/announcements/delete",
    method: "DELETE",
    params: {
      id: cell.row.values.id,
    },
  };
}

export function toBackendDateTime(dateTimeString) {
  if (!dateTimeString) {
    return undefined;
  }

  return new Date(dateTimeString).toISOString();
}

export function formatAnnouncementDateTime(dateTimeString) {
  if (!dateTimeString) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateTimeString));
}
