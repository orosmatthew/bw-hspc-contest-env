export type ContestLanguage = 'Java' | 'CSharp' | 'CPP' | 'Python';

export type TeamData = {
	teamId: number;
	teamName: string;
	contestId: number;
	contestName: string;
	language: ContestLanguage;
};
