import React from "react";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import AnnouncementForm from "main/components/Announcement/AnnouncementForm";
import { useParams, useNavigate } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function AdminEditAnnouncementsPage() {
  const { commonsId, id } = useParams();
  const navigate = useNavigate();

  // Stryker disable all
  const { data: announcement } = useBackend(
    [`/api/announcements/getbyid?id=${id}`],
    {
      method: "GET",
      url: "/api/announcements/getbyid",
      params: {
        id: id,
      },
    },
  );

  const { data: commonsPlus } = useBackend(
    [`/api/commons/plus?id=${commonsId}`],
    {
      method: "GET",
      url: "/api/commons/plus",
      params: {
        id: commonsId,
      },
    },
  );
  // Stryker restore all

  const commonsName = commonsPlus?.commons?.name;

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateString);
    if (!hasTimezone) return dateString.substring(0, 16);

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
    })
      .formatToParts(date)
      .reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});

    const hour = parts.hour === "24" ? "00" : parts.hour;
    return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
  };

  const initialContents = announcement
    ? {
        ...announcement,
        startDate: formatDateForInput(announcement.startDate),
        endDate: formatDateForInput(announcement.endDate),
      }
    : null;

  const objectToAxiosParams = (announcement) => ({
    url: "/api/announcements/put",
    method: "PUT",
    params: {
      id: id,
      commonsId: commonsId,
      startDate: announcement.startDate,
      endDate: announcement.endDate || null,
      announcementText: announcement.announcementText,
    },
  });

  const onSuccess = (announcement) => {
    toast(`Announcement Updated - id: ${announcement.id}`);
    navigate(`/admin/announcements/${commonsId}`);
  };

  // Stryker disable all
  const mutation = useBackendMutation(objectToAxiosParams, { onSuccess }, [
    `/api/announcements/getbycommonsid?commonsId=${commonsId}`,
  ]);
  // Stryker restore all

  const submitAction = async (data) => {
    mutation.mutate(data);
  };

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit Announcement</h1>
        <h2>for Commons {commonsName}</h2>
        {initialContents && (
          <AnnouncementForm
            submitAction={submitAction}
            buttonLabel={"Update"}
            initialContents={initialContents}
          />
        )}
      </div>
    </BasicLayout>
  );
}
