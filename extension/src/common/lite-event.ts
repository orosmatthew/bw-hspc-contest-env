// Modified from JasonKleban @ https://gist.github.com/JasonKleban/50cee44960c225ac1993c922563aa540

export interface ILiteEvent<T> {
	add(handler: { (data?: T): void }): void;
	remove(handler: { (data?: T): void }): void;
}

export class LiteEvent<T> implements ILiteEvent<T> {
	protected handlers: Array<{ (data?: T): void }> = [];

	public add(handler: { (data?: T): void }): void {
		this.handlers.push(handler);
	}

	public remove(handler: { (data?: T): void }): boolean {
		const countBefore = this.handlers.length;
		this.handlers = this.handlers.filter((h) => h !== handler);
		return countBefore !== this.handlers.length;
	}

	public trigger(data?: T) {
		this.handlers.slice(0).forEach((h) => h(data));
	}

	public expose(): ILiteEvent<T> {
		return this;
	}
}
