import { createSlice } from '@reduxjs/toolkit';

interface SettingsState {
  // Language removed as we only support Italian
}

const initialState: SettingsState = {};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {}
});

export default settingsSlice.reducer;