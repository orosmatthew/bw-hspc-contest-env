import { building } from '$app/environment';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export const db = (building ? undefined : drizzle('file:./data/data.db')) as ReturnType<
	typeof drizzle
>;
