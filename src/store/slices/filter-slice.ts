import type { EventCategory, EventStatus } from "@/types/event";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface FilterState {
  search: string;
  category: EventCategory | "";
  status: EventStatus | "";
  collegeId: string;
  isInterCollege: boolean;
  sortBy: "date" | "createdAt" | "title";
  sortOrder: "asc" | "desc";
}

const initialState: FilterState = {
  search: "",
  category: "",
  status: "upcoming",
  collegeId: "",
  isInterCollege: false,
  sortBy: "date",
  sortOrder: "asc",
};

const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setCategory(state, action: PayloadAction<EventCategory | "">) {
      state.category = action.payload;
    },
    setStatus(state, action: PayloadAction<EventStatus | "">) {
      state.status = action.payload;
    },
    setCollegeId(state, action: PayloadAction<string>) {
      state.collegeId = action.payload;
    },
    setInterCollege(state, action: PayloadAction<boolean>) {
      state.isInterCollege = action.payload;
    },
    setSort(
      state,
      action: PayloadAction<{
        sortBy: FilterState["sortBy"];
        sortOrder: FilterState["sortOrder"];
      }>,
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setSearch,
  setCategory,
  setStatus,
  setCollegeId,
  setInterCollege,
  setSort,
  resetFilters,
} = filterSlice.actions;

export default filterSlice.reducer;
