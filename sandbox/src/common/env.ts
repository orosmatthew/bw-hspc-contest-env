import 'dotenv/config';
import z from 'zod';

export const envSchema = z.object({
	WEB_URL: z.string(),
	REPO_URL: z.string(),
	SECRET: z.string()
});
export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
	const envParse = envSchema.safeParse(process.env);
	if (!envParse.success) {
		throw new Error(`Failed to validate env: ${envParse.error.message}`);
	}
	return envParse.data;
}
