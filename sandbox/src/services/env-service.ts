import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
	WEB_URL: z.string(),
	REPO_URL: z.string(),
	SANDBOX_SECRET: z.string()
});
export type Env = z.infer<typeof envSchema>;

export class EnvService {
	private _env: Env;

	public constructor() {
		const envParse = envSchema.safeParse(process.env);
		if (!envParse.success) {
			throw new Error(`Failed to validate env: ${envParse.error.message}`);
		}
		this._env = envParse.data;
	}

	public get(): Env {
		return this._env;
	}
}
