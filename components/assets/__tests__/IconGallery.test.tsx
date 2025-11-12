import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { IconGallery } from '../IconGallery';
import { useAssetStore } from '@/store/assetStore';

jest.mock('@/store/assetStore');
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

describe('IconGallery', () => {
  const mockProjectId = 'test-project-id';
  const mockIcons = [
    'https://example.com/icon1.png',
    'https://example.com/icon2.png',
    'https://example.com/icon3.png',
    'https://example.com/icon4.png',
    'https://example.com/icon5.png',
    'https://example.com/icon6.png',
  ];

  const mockUseAssetStore = useAssetStore as jest.MockedFunction<typeof useAssetStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAssetStore.mockReturnValue({
      generatedIcons: [],
      selectedIcon: null,
      loading: false,
      error: null,
      generationProgress: {
        status: 'idle',
        progress: 0,
        message: '',
      },
      generateIcons: jest.fn(),
      selectIcon: jest.fn(),
      applyIcon: jest.fn(),
      clearGeneratedIcons: jest.fn(),
      // Other store properties
      assets: [],
      generatedSounds: [],
      selectedSound: null,
      generateSounds: jest.fn(),
      selectSound: jest.fn(),
      applySound: jest.fn(),
      clearGeneratedSounds: jest.fn(),
      fetchAssets: jest.fn(),
      deleteAsset: jest.fn(),
      regenerateAsset: jest.fn(),
      setGenerationProgress: jest.fn(),
      clearError: jest.fn(),
      reset: jest.fn(),
    });
  });

  it('renders icon generation form initially', () => {
    const { getByPlaceholderText, getByText } = render(
      <IconGallery projectId={mockProjectId} />
    );

    expect(getByText('Generate App Icon')).toBeTruthy();
    expect(getByPlaceholderText(/E.g., fitness app/)).toBeTruthy();
    expect(getByText('Generate Icons')).toBeTruthy();
  });

  it('disables generate button when prompt is empty', () => {
    const { getByText } = render(<IconGallery projectId={mockProjectId} />);

    const generateButton = getByText('Generate Icons').parent;
    expect(generateButton?.props.accessibilityState.disabled).toBe(true);
  });

  it('calls generateIcons when form is submitted', async () => {
    const mockGenerateIcons = jest.fn().mockResolvedValue(mockIcons);
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generateIcons: mockGenerateIcons,
    });

    const { getByPlaceholderText, getByText } = render(
      <IconGallery projectId={mockProjectId} />
    );

    const input = getByPlaceholderText(/E.g., fitness app/);
    fireEvent.changeText(input, 'fitness app');

    const generateButton = getByText('Generate Icons');
    fireEvent.press(generateButton);

    await waitFor(() => {
      expect(mockGenerateIcons).toHaveBeenCalledWith(mockProjectId, 'fitness app');
    });
  });

  it('displays loading state during generation', () => {
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      loading: true,
      generationProgress: {
        status: 'generating',
        progress: 50,
        message: 'Generating 6 icon variations...',
      },
    });

    const { getByText } = render(<IconGallery projectId={mockProjectId} />);

    expect(getByText('Generating 6 icon variations...')).toBeTruthy();
  });

  it('displays icon grid after generation', () => {
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generatedIcons: mockIcons,
    });

    const { getByText, getAllByRole } = render(<IconGallery projectId={mockProjectId} />);

    expect(getByText('Select an Icon')).toBeTruthy();
    // 6 icons should be displayed
    const images = getAllByRole('image');
    expect(images.length).toBeGreaterThanOrEqual(6);
  });

  it('selects icon when tapped', () => {
    const mockSelectIcon = jest.fn();
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generatedIcons: mockIcons,
      selectIcon: mockSelectIcon,
    });

    const { getAllByRole } = render(<IconGallery projectId={mockProjectId} />);

    const firstIcon = getAllByRole('image')[0].parent;
    if (firstIcon) {
      fireEvent.press(firstIcon);
      expect(mockSelectIcon).toHaveBeenCalledWith(mockIcons[0]);
    }
  });

  it('shows apply button when icon is selected', () => {
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generatedIcons: mockIcons,
      selectedIcon: mockIcons[0],
    });

    const { getByText } = render(<IconGallery projectId={mockProjectId} />);

    expect(getByText('Apply Icon')).toBeTruthy();
  });

  it('applies icon when apply button is pressed', async () => {
    const mockApplyIcon = jest.fn().mockResolvedValue(undefined);
    const mockOnIconApplied = jest.fn();

    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generatedIcons: mockIcons,
      selectedIcon: mockIcons[0],
      applyIcon: mockApplyIcon,
    });

    const { getByText } = render(
      <IconGallery projectId={mockProjectId} onIconApplied={mockOnIconApplied} />
    );

    const applyButton = getByText('Apply Icon');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockApplyIcon).toHaveBeenCalledWith(mockProjectId, mockIcons[0]);
      expect(mockOnIconApplied).toHaveBeenCalledWith(mockIcons[0]);
    });
  });

  it('displays error message when generation fails', () => {
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      error: 'Failed to generate icons',
    });

    const { getByText } = render(<IconGallery projectId={mockProjectId} />);

    expect(getByText('Failed to generate icons')).toBeTruthy();
  });

  it('clears icons when regenerate is pressed', () => {
    const mockClearGeneratedIcons = jest.fn();
    mockUseAssetStore.mockReturnValue({
      ...mockUseAssetStore(),
      generatedIcons: mockIcons,
      clearGeneratedIcons: mockClearGeneratedIcons,
    });

    const { getByText } = render(<IconGallery projectId={mockProjectId} />);

    const regenerateButton = getByText('Regenerate');
    fireEvent.press(regenerateButton);

    expect(mockClearGeneratedIcons).toHaveBeenCalled();
  });
});
