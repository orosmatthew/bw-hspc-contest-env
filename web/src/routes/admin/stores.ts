import { writable } from 'svelte/store';

export const selectedContest = writable<number | null>(null);
