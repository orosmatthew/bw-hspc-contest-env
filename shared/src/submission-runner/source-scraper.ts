import { join, relative, extname } from 'path';
import type { SourceFileWithText } from './common';
import fs from 'fs-extra';

export async function getSourceFilesWithText(
	studentCodeRootForProblem: string,
	...extensions: string[]
): Promise<SourceFileWithText[]> {
	const normalizedExtensions = extensions.map((ext) => ext.toLowerCase());

	console.log(`- SCAN: ${studentCodeRootForProblem}`);

	const result: Array<SourceFileWithText> = [];

	async function walk(dir: string): Promise<void> {
		let entries: fs.Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch (e) {
			console.error(
				`Failed to read directory "${dir}": ${e instanceof Error ? e.message : String(e)}`
			);
			return;
		}

		await Promise.all(
			entries.map(async (entry) => {
				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					await walk(fullPath);
				} else if (entry.isFile()) {
					const ext = extname(entry.name).toLowerCase();
					if (normalizedExtensions.includes(ext)) {
						try {
							const content = await fs.readFile(fullPath, { encoding: 'utf8' });
							result.push({
								pathFromProblemRoot: relative(studentCodeRootForProblem, fullPath),
								content
							});
						} catch (e) {
							console.error(
								`Failed to read file "${fullPath}": ${e instanceof Error ? e.message : String(e)}`
							);
						}
					}
				}
			})
		);
	}

	await walk(studentCodeRootForProblem);

	console.log(`Found ${result.length} source files`);
	return result;
}
