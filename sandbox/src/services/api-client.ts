import z from 'zod';
import {
	GetSubmissionRes,
	getSubmissionResSchema,
	PostSubmissionReq,
	PostSubmissionRes,
	postSubmissionResSchema
} from 'bwcontest-shared/types/api/sandbox';
import urlJoin from 'url-join';

export class ApiClient {
	private _baseUrl: string;
	private _secret: string;

	public constructor(params: { baseUrl: string; secret: string }) {
		this._baseUrl = params.baseUrl;
		this._secret = params.secret;
	}

	public async getSubmission(): Promise<GetSubmissionRes> {
		try {
			const res = await fetch(urlJoin(this._baseUrl, '/api/sandbox/submission'), {
				method: 'GET',
				headers: { Authorization: `Bearer ${this._secret}` }
			});
			return await this._processResponse(res, getSubmissionResSchema);
		} catch (e) {
			console.error(e);
			return { success: false, message: 'API error' };
		}
	}

	public async postSubmission(req: PostSubmissionReq): Promise<PostSubmissionRes> {
		try {
			const res = await fetch(urlJoin(this._baseUrl, '/api/sandbox/submission'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${this._secret}`, 'Content-Type': 'application/json' },
				body: JSON.stringify(req)
			});
			return await this._processResponse(res, postSubmissionResSchema);
		} catch (e) {
			console.error(e);
			return { success: false, message: 'API error' };
		}
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
