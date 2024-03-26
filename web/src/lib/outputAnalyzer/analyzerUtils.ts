export const newline = '\n';

export function normalizeInputLines(input: string): string[] {
	return trimmedNonemptyLines(input);
}

export function normalizeNewlines(output: string): string {
	return output.replaceAll('\r\n', newline).replaceAll('\r', newline);
}

export function splitLines(output: string): string[] {
	return normalizeNewlines(output).split(newline);
}

export function trimmedLines(output: string): string[] {
	return splitLines(output).map((line) => line.trim());
}

export function trimmedNonemptyLines(output: string): string[] {
	return trimmedLines(output).filter((line) => line.length > 0);
}
