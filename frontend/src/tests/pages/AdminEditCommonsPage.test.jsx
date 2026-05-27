import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import AdminEditCommonsPage from "main/pages/AdminEditCommonsPage";
import * as useBackendModule from "main/utils/useBackend";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import healthUpdateStrategyListFixtures from "../../fixtures/healthUpdateStrategyListFixtures";
import { vi } from "vitest";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    __esModule: true,
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => ({
      id: 5,
    }),
    Navigate: (x) => {
      mockNavigate(x);
      return null;
    },
  };
});

describe("AdminEditCommonsPage tests", () => {
  describe("tests where backend is working normally", () => {
    const axiosMock = new AxiosMockAdapter(axios);

    beforeEach(() => {
      axiosMock.reset();
      axiosMock.resetHistory();
      axiosMock
        .onGet("/api/currentUser")
        .reply(200, apiCurrentUserFixtures.userOnly);
      axiosMock
        .onGet("/api/systemInfo")
        .reply(200, systemInfoFixtures.showingNeither);
      axiosMock
        .onGet("/api/commons/all-health-update-strategies")
        .reply(200, healthUpdateStrategyListFixtures.simple);
      axiosMock.onGet("/api/commons", { params: { id: 5 } }).reply(200, {
        id: 5,
        name: "Seths Common",
        startingDate: "2022-03-05",
        lastDate: "2023-03-05",
        startingBalance: 1200,
        cowPrice: 15,
        milkPrice: 10,
        degradationRate: 20.3,
        capacityPerUser: 10,
        carryingCapacity: 100,
        aboveCapacityHealthUpdateStrategy: "strat1",
        belowCapacityHealthUpdateStrategy: "strat2",
        hidden: false,
      });
      axiosMock
        .onGet("/api/commonsfeatures", { params: { commonsId: 5 } })
        .reply(200, {
          FARMERS_CAN_SEE_LEADERBOARD: false,
        });
      axiosMock.onPut("/api/commons/update").reply(200, {
        id: 5,
        name: "Phill's Commons",
        startingDate: "2022-03-07",
        lastDate: "2023-03-07",
        startingBalance: 1400,
        cowPrice: 200,
        milkPrice: 5,
        degradationRate: 40.3,
        capacityPerUser: 20,
        carryingCapacity: 200,
        showLeaderboard: false,
        showChat: false,
        hidden: true,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const queryClient = new QueryClient();
    test("renders without crashing", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminEditCommonsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    });

    test("Is populated with the data provided", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminEditCommonsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(await screen.findByLabelText(/Commons Name/)).toBeInTheDocument();

      const nameField = screen.getByLabelText(/Commons Name/);
      const startingBalanceField = screen.getByLabelText(/Starting Balance/);
      const cowPriceField = screen.getByLabelText(/Cow Price/);
      const milkPriceField = screen.getByLabelText(/Milk Price/);
      const startingDateField = screen.getByLabelText(/Starting Date/);
      const lastDateField = screen.getByLabelText(/Last Date/);
      const degradationRateField = screen.getByLabelText(/Degradation Rate/);
      const capacityPerUserField = screen.getByLabelText(/Capacity Per User/);
      const carryingCapacityField = screen.getByLabelText(/Carrying Capacity/);
      const aboveCapacityHealthUpdateStrategyField =
        screen.getByLabelText(/When above capacity/);
      const belowCapacityHealthUpdateStrategyField =
        screen.getByLabelText(/When below capacity/);
      const hiddenField = screen.getByLabelText(/Hidden/);

      expect(nameField).toHaveValue("Seths Common");
      expect(startingDateField).toHaveValue("2022-03-05");
      expect(lastDateField).toHaveValue("2023-03-05");
      expect(startingBalanceField).toHaveValue(1200);
      expect(cowPriceField).toHaveValue(15);
      expect(milkPriceField).toHaveValue(10);
      expect(degradationRateField).toHaveValue(20.3);
      expect(capacityPerUserField).toHaveValue(10);
      expect(carryingCapacityField).toHaveValue(100);
      expect(aboveCapacityHealthUpdateStrategyField).toHaveValue("strat1");
      expect(belowCapacityHealthUpdateStrategyField).toHaveValue("strat2");
      expect(hiddenField).not.toBeChecked();

      const featureCheckbox = await screen.findByTestId(
        "CommonsFeaturesForm-FARMERS_CAN_SEE_LEADERBOARD",
      );
      expect(featureCheckbox).toBeInTheDocument();
      expect(featureCheckbox).not.toBeChecked();
    });

    test("Updates commons features when form is submitted", async () => {
      axiosMock
        .onGet("/api/commonsfeatures", { params: { commonsId: 5 } })
        .reply(200, {
          FARMERS_CAN_SEE_LEADERBOARD: false,
        });
      axiosMock.onPost("/api/commonsfeatures").reply(200, {
        message: "Commons features updated successfully",
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminEditCommonsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(
        await screen.findByTestId(
          "CommonsFeaturesForm-FARMERS_CAN_SEE_LEADERBOARD",
        ),
      ).toBeInTheDocument();

      const featureCheckbox = screen.getByTestId(
        "CommonsFeaturesForm-FARMERS_CAN_SEE_LEADERBOARD",
      );
      fireEvent.click(featureCheckbox);
      expect(featureCheckbox).toBeChecked();

      const submitButton = screen.getByTestId(
        "CommonsFeaturesForm-Submit-Button",
      );
      fireEvent.click(submitButton);

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          "Commons features updated successfully",
        ),
      );
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(axiosMock.history.post.length).toBe(1);
      expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({
        commonsId: 5,
        FARMERS_CAN_SEE_LEADERBOARD: true,
      });
    });

    test("Calls useBackend and useBackendMutation with expected commons features args", async () => {
      const useBackendSpy = vi.spyOn(useBackendModule, "useBackend");
      const useBackendMutationSpy = vi.spyOn(
        useBackendModule,
        "useBackendMutation",
      );

      useBackendSpy.mockImplementation((queryKey, config, initialData) => {
        if (queryKey[0] === "/api/commons?id=5") {
          return {
            data: {
              id: 5,
              name: "Seths Common",
              startingDate: "2022-03-05",
              lastDate: "2023-03-05",
              startingBalance: 1200,
              cowPrice: 15,
              milkPrice: 10,
              degradationRate: 20.3,
              capacityPerUser: 10,
              carryingCapacity: 100,
              aboveCapacityHealthUpdateStrategy: "strat1",
              belowCapacityHealthUpdateStrategy: "strat2",
              hidden: false,
            },
            _error: null,
            _status: "success",
          };
        }
        if (queryKey[0] === "/api/commonsfeatures?commonsId=5") {
          return {
            data: { FARMERS_CAN_SEE_LEADERBOARD: false },
            _error: null,
            _status: "success",
          };
        }
        return {
          data: initialData,
          _error: null,
          _status: "success",
        };
      });

      const mockCommonsFeaturesMutate = vi.fn();
      useBackendMutationSpy.mockReturnValue({
        mutate: mockCommonsFeaturesMutate,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminEditCommonsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await waitFor(() => expect(useBackendSpy).toHaveBeenCalled());

      const commonsFeaturesBackendCall = useBackendSpy.mock.calls.find(
        (call) =>
          Array.isArray(call[0]) &&
          call[0][0] === "/api/commonsfeatures?commonsId=5",
      );
      expect(commonsFeaturesBackendCall).toBeDefined();
      expect(commonsFeaturesBackendCall[1]).toEqual({
        method: "GET",
        url: "/api/commonsfeatures",
        params: {
          commonsId: 5,
        },
      });
      expect(commonsFeaturesBackendCall[2]).toEqual({});

      const commonsFeaturesMutationCall = useBackendMutationSpy.mock.calls.find(
        (call) =>
          Array.isArray(call[2]) &&
          call[2][0] === "/api/commonsfeatures?commonsId=5",
      );

      expect(commonsFeaturesMutationCall).toBeDefined();
      expect(commonsFeaturesMutationCall[1]).toEqual({
        onSuccess: expect.any(Function),
      });

      const objectToAxiosParams = commonsFeaturesMutationCall[0];
      expect(
        objectToAxiosParams({ FARMERS_CAN_SEE_LEADERBOARD: true }),
      ).toEqual({
        url: "/api/commonsfeatures",
        method: "POST",
        data: {
          commonsId: 5,
          FARMERS_CAN_SEE_LEADERBOARD: true,
        },
      });
    });

    test("Changes when you click Update", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminEditCommonsPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(await screen.findByLabelText(/Commons Name/)).toBeInTheDocument();

      const nameField = screen.getByLabelText(/Commons Name/);
      const startingBalanceField = screen.getByLabelText(/Starting Balance/);
      const cowPriceField = screen.getByLabelText(/Cow Price/);
      const milkPriceField = screen.getByLabelText(/Milk Price/);
      const startingDateField = screen.getByLabelText(/Starting Date/);
      const lastDateField = screen.getByLabelText(/Last Date/);
      const degradationRateField = screen.getByLabelText(/Degradation Rate/);
      const capacityPerUserField = screen.getByLabelText(/Capacity Per User/);
      const carryingCapacityField = screen.getByLabelText(/Carrying Capacity/);
      const aboveCapacityHealthUpdateStrategyField =
        screen.getByLabelText(/When above capacity/);
      const belowCapacityHealthUpdateStrategyField =
        screen.getByLabelText(/When below capacity/);
      const hiddenField = screen.getByLabelText(/Hidden/);

      expect(nameField).toHaveValue("Seths Common");
      expect(startingDateField).toHaveValue("2022-03-05");
      expect(lastDateField).toHaveValue("2023-03-05");
      expect(startingBalanceField).toHaveValue(1200);
      expect(cowPriceField).toHaveValue(15);
      expect(milkPriceField).toHaveValue(10);
      expect(degradationRateField).toHaveValue(20.3);
      expect(capacityPerUserField).toHaveValue(10);
      expect(carryingCapacityField).toHaveValue(100);
      expect(aboveCapacityHealthUpdateStrategyField).toHaveValue("strat1");
      expect(belowCapacityHealthUpdateStrategyField).toHaveValue("strat2");
      expect(hiddenField).not.toBeChecked();

      const submitButton = screen.getByText("Update");

      expect(submitButton).toBeInTheDocument();

      fireEvent.change(nameField, { target: { value: "Phill's Commons" } });
      fireEvent.change(startingDateField, { target: { value: "2022-03-07" } });
      fireEvent.change(lastDateField, { target: { value: "2023-03-07" } });
      fireEvent.change(startingBalanceField, { target: { value: 1400 } });
      fireEvent.change(cowPriceField, { target: { value: 200 } });
      fireEvent.change(milkPriceField, { target: { value: 5 } });
      fireEvent.change(degradationRateField, { target: { value: 40.3 } });
      fireEvent.change(capacityPerUserField, { target: { value: 20 } });
      fireEvent.change(carryingCapacityField, { target: { value: 200 } });
      fireEvent.change(aboveCapacityHealthUpdateStrategyField, {
        target: { value: "strat2" },
      });
      fireEvent.change(belowCapacityHealthUpdateStrategyField, {
        target: { value: "strat3" },
      });
      fireEvent.click(hiddenField);

      fireEvent.click(submitButton);

      await waitFor(() => expect(mockToast).toHaveBeenCalled());
      expect(mockToast).toBeCalledWith(
        "Commons Updated - id: 5 name: Phill's Commons",
      );
      expect(mockNavigate).toBeCalledWith({ to: "/admin/listcommons" });

      expect(axiosMock.history.put.length).toBe(1); // times called
      expect(axiosMock.history.put[0].params).toEqual({ id: 5 });
      expect(axiosMock.history.put[0].data).toBe(
        JSON.stringify({
          name: "Phill's Commons",
          startingBalance: 1400,
          cowPrice: 200,
          milkPrice: 5,
          startingDate: "2022-03-07T00:00:00.000Z",
          lastDate: "2023-03-07T00:00:00.000Z",
          degradationRate: 40.3,
          capacityPerUser: 20,
          carryingCapacity: 200,
          aboveCapacityHealthUpdateStrategy: "strat2",
          belowCapacityHealthUpdateStrategy: "strat3",
          hidden: true,
        }),
      ); // posted object
    });
  });
});
