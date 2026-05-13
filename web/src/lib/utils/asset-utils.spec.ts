import { untagAssets } from '@immich/sdk';
import type { AssetResponseDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { canCopyImageToClipboard, getAssetFilename, getFilenameExtension, removeTag } from './asset-utils';

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');

  return {
    ...actual,
    untagAssets: vi.fn(),
  };
});
const mockUntagAssets = vi.mocked(untagAssets);

vi.mock('@immich/ui', async () => {
  const actual = await vi.importActual<typeof import('@immich/ui')>('@immich/ui');

  return {
    ...actual,
    toastManager: {
      info: vi.fn(),
      success: vi.fn(),
    },
  };
});
const mockToastManagerSuccess = vi.mocked(toastManager.success);
const mockToastManagerInfo = vi.mocked(toastManager.info);

describe('get file extension from filename', () => {
  it('returns the extension without including the dot', () => {
    expect(getFilenameExtension('filename.txt')).toEqual('txt');
  });

  it('takes the last file extension and ignores the rest', () => {
    expect(getFilenameExtension('filename.txt.pdf')).toEqual('pdf');
    expect(getFilenameExtension('filename.txt.pdf.jpg')).toEqual('jpg');
  });

  it('returns an empty string when no file extension is found', () => {
    expect(getFilenameExtension('filename')).toEqual('');
    expect(getFilenameExtension('filename.')).toEqual('');
    expect(getFilenameExtension('filename..')).toEqual('');
    expect(getFilenameExtension('.filename')).toEqual('');
  });

  it('returns the extension from a filepath', () => {
    expect(getFilenameExtension('/folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('./folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('~/folder/file.txt')).toEqual('txt');
    expect(getFilenameExtension('./folder/.file.txt')).toEqual('txt');
    expect(getFilenameExtension('/folder.with.dots/file.txt')).toEqual('txt');
  });
});

describe('get asset filename', () => {
  it('returns the filename including file extension', () => {
    for (const { asset, result } of [
      {
        asset: {
          originalFileName: 'filename',
          originalPath: '/data/library/test/2016/2016-08-30/filename.jpg',
        },
        result: 'filename.jpg',
      },
      {
        asset: {
          originalFileName: 'new-filename',
          originalPath: '/data/library/89d14e47-a40d-4cae-a347-a914cdef1f22/2016/2016-08-30/filename.jpg',
        },
        result: 'new-filename.jpg',
      },
      {
        asset: {
          originalFileName: 'new-filename.txt',
          originalPath: '/data/library/test/2016/2016-08-30/filename.txt.jpg',
        },
        result: 'new-filename.txt.jpg',
      },
    ]) {
      expect(getAssetFilename(asset as AssetResponseDto)).toEqual(result);
    }
  });
});

describe('copy image to clipboard', () => {
  // This test is dubious, as it totally on the environment where the test is run which is mocked.
  it('should allow copy image to clipboard', () => {
    expect(canCopyImageToClipboard()).toEqual(true);
  });
});

describe('remove tag from asset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only return asset ids for successfully untagged assets', async () => {
    mockUntagAssets.mockResolvedValueOnce([
      { success: true, id: 'asset-1' },
      { success: false, id: 'asset-2' },
      { success: true, id: 'asset-3' },
    ]);

    const result = await removeTag({
      assetIds: ['asset-1', 'asset-2', 'asset-3'],
      tagIds: ['tag-1'],
    });

    expect(result).toEqual(['asset-1', 'asset-3']);
  });

  it('should not show any toast messages if showNotification is false', async () => {
    mockUntagAssets.mockResolvedValueOnce([{ success: true, id: 'asset-1' }]);

    await removeTag({
      assetIds: ['asset-1'],
      tagIds: ['tag-1'],
      showNotification: false,
    });

    expect(mockToastManagerSuccess).not.toHaveBeenCalled();
    expect(mockToastManagerInfo).not.toHaveBeenCalled();
  });

  it('should show a success toast message if at least one asset is successfully untagged', async () => {
    mockUntagAssets.mockResolvedValueOnce([
      { success: true, id: 'asset-1' },
      { success: false, id: 'asset-2' },
    ]);

    await removeTag({
      assetIds: ['asset-1', 'asset-2'],
      tagIds: ['tag-1'],
      showNotification: true,
    });

    expect(mockToastManagerSuccess).toHaveBeenCalled();
    expect(mockToastManagerInfo).not.toHaveBeenCalled();
  });

  it('should show an info toast message if no assets were untagged', async () => {
    mockUntagAssets.mockResolvedValueOnce([
      { success: false, id: 'asset-1' },
      { success: false, id: 'asset-2' },
    ]);

    await removeTag({
      assetIds: ['asset-1', 'asset-2'],
      tagIds: ['tag-1'],
      showNotification: true,
    });

    expect(mockToastManagerSuccess).not.toHaveBeenCalled();
    expect(mockToastManagerInfo).toHaveBeenCalled();
  });
});
