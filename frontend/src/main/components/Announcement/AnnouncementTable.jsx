import React from "react";
import OurTable, { ButtonColumn } from "main/components/OurTable";

import { useBackendMutation } from "main/utils/useBackend";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/announcementUtils";
import { useNavigate } from "react-router";
import { hasRole } from "main/utils/currentUser";
import { useQueryClient } from "react-query";

export default function AnnouncementTable({ announcements, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const editCallback = (cell) => {
    navigate(
      `/admin/announcements/${cell.row.original.commonsId}/edit/${cell.row.original.id}`,
    );
  };

  // Stryker disable all : hard to test for query caching
  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    {
      onSuccess: (message) => {
        onDeleteSuccess(message);
        queryClient.invalidateQueries();
      },
    },
    ["/api/announcements/getbycommonsid"],
  );
  // Stryker restore all

  // Stryker disable next-line all : TODO try to make a good test for this
  const deleteCallback = async (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    {
      Header: "id",
      accessor: "id",
    },
    {
      Header: "Start Date ISO Format",
      accessor: "startDate",
    },
    {
      Header: "End Date ISO Format",
      accessor: "endDate",
    },
    {
      Header: "Announcement",
      accessor: "announcementText",
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(
      ButtonColumn("Edit", "primary", editCallback, "AnnouncementTable"),
    );
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, "AnnouncementTable"),
    );
  }

  return (
    <OurTable
      data={announcements}
      columns={columns}
      testid={"AnnouncementTable"}
    />
  );
}
