import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as activityService from '../../services/activities';
import type { Activity } from '../../types';

interface ActivityState {
  items: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'activities/fetchAll',
  async () => {
    return await activityService.getActivities();
  }
);

export const addActivity = createAsyncThunk(
  'activities/add',
  async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    return await activityService.createActivity(activity);
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Activities
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching activities';
      })
      // Add Activity
      .addCase(addActivity.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  }
});

export default activitySlice.reducer;