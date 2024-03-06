export type ContestLanguage = 'Java' | 'CSharp' | 'CPP';

export type TeamData = {
	teamId: number;
	teamName: string;
	contestId: number;
	contestName: string;
	language: ContestLanguage;
};
