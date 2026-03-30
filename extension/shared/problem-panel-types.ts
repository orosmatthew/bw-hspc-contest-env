import type { ProblemPublic } from 'bwcontest-shared/types/problem';

export type MessageType =
	| { msg: 'onRequestProblemData' }
	| { msg: 'onRun'; data: { problemId: number; input: string } }
	| { msg: 'onKill' }
	| { msg: 'onSubmit'; data: { problemId: number } };

export type WebviewMessageType =
	| { msg: 'onProblemData'; data: Array<ProblemPublic> }
	| { msg: 'onRunning' }
	| { msg: 'onRunningDone' }
	| { msg: 'onRunningOutput'; data: string };
