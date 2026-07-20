import { useCallback, useEffect } from "react";
import {
  BOOKMARKS_ARGS,
  useAddBookmarkMutation,
  useGetBookmarksQuery,
  useRemoveBookmarkMutation,
} from "@/store/api/bookmark-api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addBookmarkId,
  hydrateBookmarks,
  removeBookmarkId,
} from "@/store/slices/bookmark-slice";

/** The Saved Events list. */
export function useBookmarks() {
  return useGetBookmarksQuery(BOOKMARKS_ARGS);
}

/**
 * Keeps the saved-id set in sync with the server. Mount once, high in the tree
 * (the tabs layout), so every EventCard's bookmark icon is correct on first paint.
 */
export function useHydrateBookmarks() {
  const dispatch = useAppDispatch();
  const { data } = useBookmarks();

  useEffect(() => {
    if (data) dispatch(hydrateBookmarks(data.items.map((b) => b.id)));
  }, [data, dispatch]);
}

/** O(1) lookup, and re-renders only the cards whose state actually changed. */
export function useIsBookmarked(eventId: string): boolean {
  return useAppSelector((s) => !!s.bookmarks.ids[eventId]);
}

export function useToggleBookmark() {
  const dispatch = useAppDispatch();
  const [add, addState] = useAddBookmarkMutation();
  const [remove, removeState] = useRemoveBookmarkMutation();

  const toggle = useCallback(
    async (eventId: string, isBookmarked: boolean) => {
      // Flip the icon immediately, then reconcile.
      dispatch(isBookmarked ? removeBookmarkId(eventId) : addBookmarkId(eventId));
      try {
        if (isBookmarked) {
          await remove(eventId).unwrap();
        } else {
          await add(eventId).unwrap();
        }
      } catch {
        // Put it back the way it was.
        dispatch(
          isBookmarked ? addBookmarkId(eventId) : removeBookmarkId(eventId),
        );
      }
    },
    [add, remove, dispatch],
  );

  return {
    toggle,
    isPending: addState.isLoading || removeState.isLoading,
  };
}
