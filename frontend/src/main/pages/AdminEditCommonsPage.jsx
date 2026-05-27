import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useParams } from "react-router";
import CommonsForm from "main/components/Commons/CommonsForm";
import CommonsFeaturesForm from "main/components/Commons/CommonsFeaturesForm";
import { Navigate } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function CommonsEditPage() {
  let { id } = useParams();

  const {
    data: commons,
    _error,
    _status,
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/commons?id=${id}`],
    {
      // Stryker disable next-line all : GET is the default, so changing this to "" doesn't introduce a bug
      method: "GET",
      url: `/api/commons`,
      params: {
        id,
      },
    },
  );

  const objectToAxiosPutParams = (commons) => ({
    url: "/api/commons/update",
    method: "PUT",
    params: {
      id: commons.id,
    },
    data: {
      name: commons.name,
      startingBalance: commons.startingBalance,
      cowPrice: commons.cowPrice,
      milkPrice: commons.milkPrice,
      startingDate: commons.startingDate,
      lastDate: commons.lastDate,
      degradationRate: commons.degradationRate,
      capacityPerUser: commons.capacityPerUser,
      carryingCapacity: commons.carryingCapacity,
      aboveCapacityHealthUpdateStrategy:
        commons.aboveCapacityHealthUpdateStrategy,
      belowCapacityHealthUpdateStrategy:
        commons.belowCapacityHealthUpdateStrategy,
      hidden: commons.hidden,
    },
  });

  const {
    data: commonsFeatures,
    _error: _commonsFeaturesError,
    _status: _commonsFeaturesStatus,
  } = useBackend(
    [`/api/commonsfeatures?commonsId=${id}`],
    {
      method: "GET",
      url: "/api/commonsfeatures",
      params: {
        commonsId: id,
      },
    },
    {},
  );

  const commonsFeaturesObjectToAxiosParams = (features) => ({
    url: "/api/commonsfeatures",
    method: "POST",
    data: {
      commonsId: id,
      ...features,
    },
  });

  const commonsFeaturesMutation = useBackendMutation(
    commonsFeaturesObjectToAxiosParams,
    {
      onSuccess: () => {
        toast("Commons features updated successfully");
      },
    },
    [`/api/commonsfeatures?commonsId=${id}`],
  );

  const commonsFeaturesSubmitAction = async (data) => {
    commonsFeaturesMutation.mutate(data);
  };

  const onSuccess = (_, commons) => {
    toast(`Commons Updated - id: ${commons.id} name: ${commons.name}`);
  };

  const mutation = useBackendMutation(
    objectToAxiosPutParams,
    { onSuccess },
    // Stryker disable next-line all : hard to set up test for caching
    [`/api/commons?id=${id}`],
  );

  const { isSuccess } = mutation;

  const submitAction = async (data) => {
    mutation.mutate(data);
  };

  if (isSuccess) {
    return <Navigate to="/admin/listcommons" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit Commons</h1>
        {commons && (
          <CommonsForm
            initialCommons={commons}
            submitAction={submitAction}
            buttonLabel="Update"
          />
        )}
        {commonsFeatures && (
          <>
            <div className="border-bottom mb-4"></div>
            <h2>Commons Feature Flags</h2>
            <CommonsFeaturesForm
              features={commonsFeatures}
              onSubmit={commonsFeaturesSubmitAction}
              buttonLabel="Save Commons Features"
            />
          </>
        )}
      </div>
    </BasicLayout>
  );
}
