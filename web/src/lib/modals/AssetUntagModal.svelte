<script lang="ts">
  import { removeTag } from '$lib/utils/asset-utils';
  import type { TreeNode } from '$lib/utils/tree-utils';
  import { Field, FormModal, Icon, Switch, Text } from '@immich/ui';
  import { mdiTagMinusOutline, mdiTag } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    tag: TreeNode;
    assetIds: string[];
    onClose: (updated?: boolean) => void;
  };

  const { tag, assetIds, onClose }: Props = $props();
  let removeFromChildren = $state(false);

  const childTagNames: string[] = [];
  const childTagIds: string[] = [];
  const traverse = (node: TreeNode, parentPath: string | null) => {
    for (const child of node.children) {
      childTagNames.push(parentPath ? `${parentPath}/${child.value}` : child.value);
      childTagIds.push(child.id ?? '');
      traverse(child, parentPath ? `${parentPath}/${child.value}` : child.value);
    }
  };
  traverse(tag, null);

  const onSubmit = async () => {
    const tagIds = [tag.id ?? ''];
    if (removeFromChildren) {
      tagIds.push(...childTagIds);
    }
    const success = await removeTag({ assetIds, tagIds });
    onClose(success?.length > 0);
  };
</script>

<FormModal
  title={$t('remove_tag')}
  size="small"
  icon={mdiTagMinusOutline}
  {onClose}
  {onSubmit}
  submitText={$t('remove')}
  submitColor="danger"
>
  <div class="mb-4">{$t('remove_tagged_assets', { values: { tagName: tag.value, count: assetIds.length } })}</div>

  {#if childTagNames.length > 0}
    <div>{$t('tag_children_list')}</div>
    <div class="pl-3">
      {#each childTagNames as childTagName (childTagName)}
        <div class="flex items-center gap-2">
          <Icon icon={mdiTag} />
          <Text size="medium" color="primary">{childTagName}</Text>
        </div>
      {/each}
    </div>
    <Field label={$t('remove_from_child_tags')}>
      <Switch data-testid="remove-from-children" bind:checked={removeFromChildren} class="mb-2" />
    </Field>
  {/if}
</FormModal>
