import type { Contest } from 'bwcontest-shared/types/contest';
import type { RepoState, TeamData } from './common-types';
import type { ProblemPublic } from 'bwcontest-shared/types/problem';
import type { SubmissionDisplayState, SubmissionPublic } from 'bwcontest-shared/types/submission';

export type WebviewMessageType =
	| { msg: 'onLogin'; data: TeamData }
	| { msg: 'onLogout' }
	| { msg: 'teamStatusUpdated'; data: SidebarTeamStatus | null }
	| { msg: 'repoStateUpdated'; data: RepoState };

export type MessageType =
	| { msg: 'onTestAndSubmit' }
	| { msg: 'onUIMount' }
	| { msg: 'onCloneOpenRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onCloneRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onOpenRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onLogin'; data: { teamName: string; password: string } }
	| { msg: 'onLogout' };

export type SidebarProblemWithSubmissions = {
	problem: ProblemPublic;
	overallState: SubmissionDisplayState | undefined;
	submissions: Array<SubmissionPublic>;
	modified: boolean;
};

export type SidebarTeamStatus = {
	contest: Contest;
	correctProblems: Array<SidebarProblemWithSubmissions>;
	processingProblems: Array<SidebarProblemWithSubmissions>;
	incorrectProblems: Array<SidebarProblemWithSubmissions>;
	notStartedProblems: Array<SidebarProblemWithSubmissions>;
};
