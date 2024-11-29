import { activitiesAPI } from './api';
import type { Activity } from '../types';

export const getActivities = () => {
  return activitiesAPI.getActivities();
};

export const createActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
  return activitiesAPI.createActivity(activity);
};