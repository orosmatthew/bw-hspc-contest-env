import { writable } from 'svelte/store';

export const contestId = writable<number | null>(null);
