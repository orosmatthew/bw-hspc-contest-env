export function pluralize(num: number, singular: string, plural: string) {
    return num === 1 ? singular : plural;
}