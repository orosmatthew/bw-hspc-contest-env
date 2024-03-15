import { writable } from 'svelte/store';

export const selectedScoreboard = writable<number | null>(null);
