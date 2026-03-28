import { ApiClient } from './api-client';
import { ContestStateSyncService } from './contest-state-sync-service';
import { ExtensionService } from './extension-service';
import { GlobalStateService } from './global-state-service';
import { SubmitService } from './submit-service';

export const extensionService = new ExtensionService();
export const apiClient = new ApiClient();
export const submitService = new SubmitService();
export const globalStateService = new GlobalStateService();
export const contestStateSyncService = new ContestStateSyncService();
