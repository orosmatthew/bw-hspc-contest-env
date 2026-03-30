import { getEnv } from '../common/env.js';
import { ApiClient } from './api-client.js';
import { GitClient } from './git-client.js';
import { SandboxService } from './sandbox-service.js';

export const apiClient = new ApiClient({
	baseUrl: getEnv().WEB_URL,
	secret: getEnv().SECRET
});
export const sandboxService = new SandboxService();
export const gitClient = new GitClient({ baseUrl: getEnv().REPO_URL });
