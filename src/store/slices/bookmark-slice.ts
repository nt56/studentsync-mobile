import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * A derived UI cache of *which* events are bookmarked — not a second source of
 * truth for the saved-events list, which stays in the RTK Query cache.
 *
 * It exists because the bookmark icon must flip the instant you tap it, and an
 * optimistic patch of the RTK Query list isn't possible: POST /api/bookmarks
 * returns only `{ id, eventId, createdAt }`, whereas the list holds fully
 * populated event objects that we don't have at the tap site.
 *
 * Redux state must stay serializable, so this is a Record rather than a Set.
 */
interface BookmarkState {
  ids: Record<string, true>;
}

const initialState: BookmarkState = { ids: {} };

const bookmarkSlice = createSlice({
  name: "bookmarks",
  initialState,
  reducers: {
    /** Called once the saved-events query resolves. */
    hydrateBookmarks(state, action: PayloadAction<string[]>) {
      state.ids = Object.fromEntries(
        action.payload.map((id) => [id, true as const]),
      );
    },
    addBookmarkId(state, action: PayloadAction<string>) {
      state.ids[action.payload] = true;
    },
    removeBookmarkId(state, action: PayloadAction<string>) {
      delete state.ids[action.payload];
    },
    /** MUST run on sign-out, or the next user inherits these. */
    clearBookmarks(state) {
      state.ids = {};
    },
  },
});

export const {
  hydrateBookmarks,
  addBookmarkId,
  removeBookmarkId,
  clearBookmarks,
} = bookmarkSlice.actions;

export default bookmarkSlice.reducer;
