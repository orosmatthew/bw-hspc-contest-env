<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { contestId } from '../stores';

	$contestId = parseInt($page.params.contestId);
	let data: PageData;
</script>
