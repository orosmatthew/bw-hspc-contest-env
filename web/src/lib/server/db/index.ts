import { env } from '$env/dynamic/private';
import { initRuntimeOnly } from '$lib/common/utils';
import { drizzle } from 'drizzle-orm/libsql';

export const db = initRuntimeOnly(() => drizzle({ connection: { url: env.DATABASE_URL } }));
