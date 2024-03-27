import { join, relative, extname } from 'path';
import { SourceFileWithText } from './types.cjs';
import fs from 'fs-extra';

export async function getSourceFilesWithText(
	studentCodeRootForProblem: string,
	...extensions: string[]
): Promise<SourceFileWithText[]> {
	extensions = extensions.map((ext) => ext.toLowerCase());

	console.log(`- SCAN: ${studentCodeRootForProblem}`);

	const result: SourceFileWithText[] = [];
	try {
		const files = await fs.promises.readdir(studentCodeRootForProblem);

		for (const file of files) {
			const fullPath = join(studentCodeRootForProblem, file);
			const stat = await fs.promises.stat(fullPath);

			if (stat.isFile()) {
				const extension = extname(fullPath).toLowerCase();
				if (extensions.includes(extension)) {
					const content = await fs.promises.readFile(fullPath, { encoding: 'utf8' });
					result.push({
						pathFromProblemRoot: relative(studentCodeRootForProblem, fullPath),
						content
					});
				}
			}
		}
	} catch (e) {
		console.error('Failed to enumerate files! ' + e?.toString());
		return [];
	}

	console.log(`Found ${result.length} source files`);
	return result;
}
