export function getCleanLines(text: string | null): string[] {
    if (text == null) {
        return [];
    }

    text.replaceAll("\r\n", "\n");
    const allLines = text.split("\n");
    const cleanLines = allLines.map(line => cleanLine(line)).filter(line => line.length > 0);
    return cleanLines;
}

export function cleanLine(line: string): string {
    return line.trim();
}
