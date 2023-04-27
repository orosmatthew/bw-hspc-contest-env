<script lang="ts">
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-slim';
	import type { Diff2HtmlUIConfig } from 'diff2html/lib/ui/js/diff2html-ui';
	import { onMount } from 'svelte';

	const diffString = `diff --git a/sample.js b/sample.js
        index 0000001..0ddf2ba
        --- a/sample.js
        +++ b/sample.js
        @@ -1 +1 @@
        -console.log("Hello World!")
        +console.log("Hello from Diff2Html!")`;

	onMount(() => {
		const diff2htmlUi = new Diff2HtmlUI(document.getElementById('diff')!, diffString);
        diff2htmlUi.draw();
	});
</script>

<div id="diff" />
