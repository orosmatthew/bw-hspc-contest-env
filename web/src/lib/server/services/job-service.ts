import { CronJob } from 'cron';
import { adminSessionRepo } from '../repos';

export class JobService {
	private _deleteExpiredAdminSessionsJob: CronJob | undefined;

	public async startDeleteExpiredAdminSessionsJob(): Promise<void> {
		await adminSessionRepo.deleteExpired();
		this._deleteExpiredAdminSessionsJob = CronJob.from({
			cronTime: '0 * * * *', // hourly
			onTick: async () => {
				await adminSessionRepo.deleteExpired();
			},
			start: true,
			waitForCompletion: true
		});
	}

	public async stopAll(): Promise<void> {
		await this._deleteExpiredAdminSessionsJob?.stop();
	}
}
