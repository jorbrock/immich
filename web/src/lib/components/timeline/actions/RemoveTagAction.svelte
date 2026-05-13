<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { TreeNode } from '$lib/utils/tree-utils';
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import AssetUntagModal from '$lib/modals/AssetUntagModal.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiTagMinusOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
    tag: TreeNode;
  }

  let { menuItem = false, tag }: Props = $props();

  const text = $t('remove_tag');
  const icon = mdiTagMinusOutline;

  const handleTagAssets = async () => {
    const assets = assetMultiSelectManager.ownedAssets;
    const didUpdate = await modalManager.show(AssetUntagModal, { tag, assetIds: assets.map(({ id }) => id) });
    if (didUpdate) {
      assetMultiSelectManager.clear();
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 't' }, onShortcut: handleTagAssets }} />

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleTagAssets} />
{/if}

{#if !menuItem}
  <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={handleTagAssets} />
{/if}
