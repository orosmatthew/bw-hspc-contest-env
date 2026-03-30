import {
	GetDataRes,
	getDataResSchema,
	PostLoginRes,
	postLoginResSchema,
	PostLogoutRes,
	postLogoutResSchema,
	PostSubmissionReq,
	PostSubmissionRes,
	postSubmissionResSchema,
	type PostLoginReq
} from 'bwcontest-shared/types/api/client';
import urlJoin from 'url-join';
import z from 'zod';
import { extensionService, globalStateService } from '.';
import { outputPanelLog } from '../common/output-panel-log';

export class ApiClient {
	async login(req: PostLoginReq): Promise<PostLoginRes> {
		try {
			const res = await fetch(urlJoin(this._getBaseUrl(), '/api/client/login'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(req)
			});
			return await this._processResponse(res, postLoginResSchema);
		} catch (e) {
			outputPanelLog.error(String(e));
			return { success: false, message: 'API error' };
		}
	}

	async logout(): Promise<PostLogoutRes> {
		try {
			const token = globalStateService.getToken();
			if (token === undefined) {
				throw new Error('Token is undefined');
			}
			const res = await fetch(urlJoin(this._getBaseUrl(), '/api/client/logout'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` }
			});
			return await this._processResponse(res, postLogoutResSchema);
		} catch (e) {
			outputPanelLog.error(String(e));
			return { success: false, message: 'API error' };
		}
	}

	async getData(): Promise<GetDataRes> {
		try {
			const token = globalStateService.getToken();
			if (token === undefined) {
				throw new Error('Token is undefined');
			}
			const res = await fetch(urlJoin(this._getBaseUrl(), '/api/client/data'), {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}` }
			});
			return await this._processResponse(res, getDataResSchema);
		} catch (e) {
			outputPanelLog.error(String(e));
			return { success: false, message: 'API error' };
		}
	}

	async postSubmission(req: PostSubmissionReq): Promise<PostSubmissionRes> {
		try {
			const token = globalStateService.getToken();
			if (token === undefined) {
				throw new Error('Token is undefined');
			}
			const res = await fetch(urlJoin(this._getBaseUrl(), '/api/client/submission'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
				body: JSON.stringify(req)
			});
			return await this._processResponse(res, postSubmissionResSchema);
		} catch (e) {
			outputPanelLog.error(String(e));
			return { success: false, message: 'API error' };
		}
	}

	private _getBaseUrl(): string {
		return extensionService.getSettings().webUrl;
	}

	private async _processResponse<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
		const contentType = res.headers.get('content-type');
		if (contentType === null || !contentType.includes('application/json')) {
			throw new Error(
				`Network Error: Expected JSON but received ${contentType ?? 'unknown'} (Status ${res.status})`
			);
		}
		const jsonParse = schema.safeParse(await res.json());
		if (jsonParse.success !== true) {
			throw new Error(`Invalid response format: ${jsonParse.error.message}`);
		}
		return jsonParse.data;
	}
}
