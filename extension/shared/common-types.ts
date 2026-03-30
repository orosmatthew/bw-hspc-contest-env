import type { GetDataRes } from 'bwcontest-shared/types/api/client';

export type TeamData = Extract<GetDataRes, { success: true }>['data'];
export type Result<T> = { success: false; message: string } | { success: true; data: T };
export type RepoState = 'noTeam' | 'noRepo' | 'repoExistsNotOpen' | 'repoOpen';
