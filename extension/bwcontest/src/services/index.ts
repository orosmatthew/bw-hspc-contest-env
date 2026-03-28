import { ApiClient } from './api-client';
import { ExtensionService } from './extension-service';
import { SubmitService } from './submit-service';

export const extensionService = new ExtensionService();
export const apiClient = new ApiClient();
export const submitService = new SubmitService();
