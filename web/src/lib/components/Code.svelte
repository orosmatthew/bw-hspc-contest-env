<script lang="ts">
	import hljs from 'highlight.js';
	import 'highlight.js/styles/atom-one-dark.min.css';

	interface Props {
		code: string;
		highlight: boolean;
	}

	let { code, highlight }: Props = $props();
</script>

<div class="border border-secondary border-2 p-2 rounded-3 fs-5" style="background-color:#282c34">
	<code class="mb-3 mt-2">
		{#if highlight}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<pre style="color:#abb2bf; font-family:JetbrainsMono">{@html hljs.highlightAuto(code, [
					'java',
					'cpp',
					'cs',
					'python'
				]).value}</pre>
		{:else}
			<pre style="color:#abb2bf; font-family:JetbrainsMono">{code}</pre>
		{/if}
	</code>
</div>
