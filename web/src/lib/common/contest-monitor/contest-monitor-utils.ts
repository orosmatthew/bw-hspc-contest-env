import type { SubmissionState } from 'bwcontest-shared/types/submission';
import type { SubmissionStateForExtension } from 'bwcontest-shared/contest-monitor/types';

export function convertSubmissionStateForExtension(
	state: SubmissionState
): SubmissionStateForExtension {
	switch (state) {
		case 'correct':
			return 'Correct';
		case 'incorrect':
			return 'Incorrect';
		default:
			return 'Processing';
	}
}
