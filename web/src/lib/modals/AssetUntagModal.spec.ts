import type { TagResponseDto } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { removeTag } from '$lib/utils/asset-utils';
import { TreeNode } from '$lib/utils/tree-utils';
import AssetUntagModal from './AssetUntagModal.svelte';

vi.mock('$lib/utils/asset-utils', () => {
  return {
    removeTag: vi.fn(),
  };
});
const mockRemoveTag = vi.mocked(removeTag);

describe('AssetUntagModal component', () => {
  const onClose = vi.fn();

  const getRemoveFromChildTagsToggle = () => screen.queryByTestId('remove-from-children');
  //const getCancelButton = () => screen.getByRole('button', { name: /cancel/i });
  const getRemoveButton = () => screen.getByRole('button', { name: /remove/i });

  const parentTag: TagResponseDto = {
    id: 'tag-id-parent',
    value: 'TagParent',
    color: '#ff0000',
    parentId: undefined,
    name: 'TagParent',
    createdAt: '',
    updatedAt: '',
  };

  const childTag: TagResponseDto = {
    id: 'tag-id-child',
    value: 'TagParent/TagChild',
    color: '#ff0000',
    parentId: 'tag-id-parent',
    name: 'TagChild',
    createdAt: '',
    updatedAt: '',
  };

  const tagDtos = [parentTag, childTag] as TagResponseDto[];

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  test('does not render child tag details / removal options if no child tags exist', () => {
    const tree = TreeNode.fromTags(tagDtos);
    const tag = tree.traverse(childTag.value);

    render(AssetUntagModal, {
      props: {
        tag,
        assetIds: ['asset-id'],
        onClose,
      },
    });

    const childTagToggle = getRemoveFromChildTagsToggle();
    expect(childTagToggle).not.toBeInTheDocument();
  });

  test('lists child tag details and shows removal toggle if child tags exist', () => {
    const tree = TreeNode.fromTags(tagDtos);
    const tag = tree.traverse(parentTag.value);

    render(AssetUntagModal, {
      props: {
        tag,
        assetIds: ['asset-id'],
        onClose,
      },
    });

    const childTagToggle = getRemoveFromChildTagsToggle();
    expect(childTagToggle).toBeInTheDocument();

    const childTagName = screen.getByText(childTag.value);
    expect(childTagName).toBeInTheDocument();
  });

  test('only removes assets from the current tag if child removal toggle is unchecked', async () => {
    const tree = TreeNode.fromTags(tagDtos);
    const tag = tree.traverse(parentTag.value);
    mockRemoveTag.mockResolvedValueOnce(['asset-id']);

    render(AssetUntagModal, {
      props: {
        tag,
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await fireEvent.click(getRemoveButton());
    expect(mockRemoveTag).toHaveBeenCalledWith({
      assetIds: ['asset-id'],
      tagIds: [parentTag.id],
    });
  });

  test('removes assets from the current tag and child tags if child removal toggle is checked', async () => {
    const tree = TreeNode.fromTags(tagDtos);
    const tag = tree.traverse(parentTag.value);
    mockRemoveTag.mockResolvedValueOnce(['asset-id']);

    render(AssetUntagModal, {
      props: {
        tag,
        assetIds: ['asset-id'],
        onClose,
      },
    });

    await fireEvent.click(getRemoveFromChildTagsToggle()!);
    await fireEvent.click(getRemoveButton());
    expect(mockRemoveTag).toHaveBeenCalledWith({
      assetIds: ['asset-id'],
      tagIds: [parentTag.id, childTag.id],
    });
  });
});
