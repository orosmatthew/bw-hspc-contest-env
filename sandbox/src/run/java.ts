import { join } from 'path';
import { exec, spawn } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function runJava(
	javaBinPath: string,
	buildDir: string,
	mainFile: string,
	mainClass: string,
	input: string
): Promise<string> {
	const compileCommand = `${join(javaBinPath, 'javac')} -cp ${join(
		buildDir,
		'src'
	)} ${mainFile} -d ${join(buildDir, 'build')}`;
	await execPromise(compileCommand);

	const runCommand = `${join(javaBinPath, 'java')} -cp "${join(buildDir, 'build')}" ${mainClass}`;

	return new Promise((resolve) => {
		let outputBuffer = '';
		const child = spawn(runCommand, { shell: true });
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (data) => {
			outputBuffer += data.toString();
		});
		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (data) => {
			outputBuffer += data.toString();
		});
		child.stdin.write(input);
		child.stdin.end();

		let resolved = false;

		child.on('close', () => {
			if (!resolved) {
				resolved = true;
				resolve(outputBuffer);
			}
		});

		setTimeout(() => {
			if (!resolved) {
				console.log('30 seconds reached, killing process');
				resolved = true;
				child.kill('SIGKILL');
				resolve(outputBuffer + '\n[Timeout after 30 seconds]');
			}
		}, 30000);
	});
}
