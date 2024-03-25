<script lang="ts">
    import { setContext } from 'svelte';
    import { tabTitleLoadedKey } from './TabBar.svelte';

    setContext(tabTitleLoadedKey, true)
  </script>
  
  <div class="tabContent">
    <slot />
  </div>
  
  <style>
    .tabContent {
        padding: 6px 12px;
        border: 1px solid #aaa;
        border-top: none;
        border-radius: 0px 0px 5px 5px;
    }
  </style>