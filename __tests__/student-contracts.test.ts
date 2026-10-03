import { configureStore } from "@reduxjs/toolkit";
import { http } from "@/lib/axios";
import { baseApi } from "@/store/api/base-api";
import { bookmarkApi } from "@/store/api/bookmark-api";
import { registrationApi } from "@/store/api/registration-api";
import { preferencesApi } from "@/store/api/preferences-api";

jest.mock("@/lib/axios", () => ({ http: { request: jest.fn() } }));
const request = http.request as jest.Mock;
const page = (number: number, items: unknown[], more: boolean) => ({
  items,
  pagination: {
    page: number,
    limit: 20,
    total: 21,
    totalPages: 2,
    hasMore: more,
  },
});

function testStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) => getDefault().concat(baseApi.middleware),
  });
}

beforeEach(() => {
  request.mockReset();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it("retains bookmark membership beyond the displayed page", async () => {
  const store = testStore();
  request.mockResolvedValue({
    data: {
      data: {
        ...page(1, [{ id: "visible" }], true),
        bookmarkedEventIds: ["visible", "on-page-two"],
      },
    },
  });
  const query = store.dispatch(
    bookmarkApi.endpoints.getBookmarks.initiate({ page: 1, limit: 20 }),
  );
  expect((await query.unwrap()).bookmarkedEventIds).toEqual([
    "visible",
    "on-page-two",
  ]);
  query.unsubscribe();
  store.dispatch(baseApi.util.resetApiState());
});

it("loads a second registration page without replacing the first", async () => {
  const store = testStore();
  request.mockImplementation(({ params }) =>
    Promise.resolve({
      data: {
        data: page(
          params.page,
          [{ id: `registration-${params.page}` }],
          params.page === 1,
        ),
      },
    }),
  );
  const first = store.dispatch(
    registrationApi.endpoints.getRegistrationPages.initiate(),
  );
  await first.unwrap();
  const next = store.dispatch(
    registrationApi.endpoints.getRegistrationPages.initiate(undefined, {
      direction: "forward",
    }),
  );
  const result = await next.unwrap();
  expect(
    result.pages.flatMap((entry) => entry.items.map((item) => item.id)),
  ).toEqual(["registration-1", "registration-2"]);
  expect(request.mock.calls[1][0].params.page).toBe(2);
  first.unsubscribe();
  next.unsubscribe();
  store.dispatch(baseApi.util.resetApiState());
});

it("fetches all registration pages before reconciling device reminders", async () => {
  const store = testStore();
  request.mockImplementation(({ params }) =>
    Promise.resolve({
      data: {
        data: page(
          params.page,
          [{ id: `registration-${params.page}` }],
          params.page === 1,
        ),
      },
    }),
  );
  const query = store.dispatch(
    registrationApi.endpoints.getReminderRegistrations.initiate(),
  );
  expect((await query.unwrap()).map((item) => item.id)).toEqual([
    "registration-1",
    "registration-2",
  ]);
  query.unsubscribe();
  store.dispatch(baseApi.util.resetApiState());
});

it("saves both preference flags using the web API contract", async () => {
  const store = testStore();
  request.mockResolvedValue({
    data: { data: { reminders: false, email: true } },
  });
  await store
    .dispatch(
      preferencesApi.endpoints.updatePreferences.initiate({
        reminders: false,
        email: true,
      }),
    )
    .unwrap();
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: "/api/users/preferences",
      method: "PUT",
      data: { reminders: false, email: true },
    }),
  );
  store.dispatch(baseApi.util.resetApiState());
});
