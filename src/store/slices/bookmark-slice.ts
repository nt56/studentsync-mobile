import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
