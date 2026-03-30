import { ApiClient } from './api-client.js';
import { EnvService } from './env-service.js';
import { GitClient } from './git-client.js';
import { SandboxService } from './sandbox-service.js';

export const envService = new EnvService();
export const apiClient = new ApiClient({
	baseUrl: envService.get().WEB_URL,
	secret: envService.get().SANDBOX_SECRET
});
export const sandboxService = new SandboxService();
export const gitClient = new GitClient({ baseUrl: envService.get().REPO_URL });
