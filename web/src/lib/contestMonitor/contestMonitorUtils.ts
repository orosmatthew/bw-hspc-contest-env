import type { SubmissionState } from '@prisma/client';
import type { SubmissionStateForExtension } from './contestMonitorSharedTypes';

export function convertSubmissionStateForExtension(
	state: SubmissionState
): SubmissionStateForExtension {
	switch (state) {
		case 'Correct':
			return 'Correct';
		case 'Incorrect':
			return 'Incorrect';
		default:
			return 'Processing';
	}
}
