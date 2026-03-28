import { GetDataRes } from 'bwcontest-shared/types/api/client';

export type TeamData = Extract<GetDataRes, { success: true }>['data'];
