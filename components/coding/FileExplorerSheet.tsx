/**
 * FileExplorerSheet Component
 * Bottom sheet that displays file tree and file viewer in split view
 */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { tokens } from '@/src/ui/tokens';
import { useFileChanges } from '@/src/hooks/useFileChanges';
import { FileTree } from './FileTree';
import { FileViewer } from './FileViewer';
import { FileSearch } from './FileSearch';

export interface FileExplorerSheetProps {
  sessionId?: string;
  isVisible: boolean;
  onClose: () => void;
}

export function FileExplorerSheet({
  sessionId,
  isVisible,
  onClose,
}: FileExplorerSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { fileTree } = useFileChanges(sessionId);

  // Track selected file and recent files
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Snap points: 50% and 90% of screen height
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  // Open/close sheet based on isVisible prop
  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isVisible]);

  // Handle file selection
  const handleFileSelect = useCallback((path: string) => {
    setSelectedFile(path);
    setShowSearch(false);

    // Add to recent files
    setRecentFiles((prev) => {
      const filtered = prev.filter((p) => p !== path);
      return [path, ...filtered].slice(0, 10); // Keep last 10
    });
  }, []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  // Get selected file content
  const selectedFileContent = selectedFile ? fileTree[selectedFile] : undefined;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Files</Text>
            {Object.keys(fileTree).length > 0 && (
              <View style={styles.fileCountBadge}>
                <Text style={styles.fileCountText}>
                  {Object.keys(fileTree).length}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {/* Search Toggle */}
            <TouchableOpacity
              style={[styles.iconButton, showSearch && styles.iconButtonActive]}
              onPress={() => setShowSearch(!showSearch)}
              activeOpacity={0.7}
            >
              <Text style={styles.iconButtonText}>🔍</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.content}>
          {Object.keys(fileTree).length === 0 ? (
            // Empty State
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No files yet</Text>
              <Text style={styles.emptyText}>
                Files will appear here as they are created by the AI
              </Text>
            </View>
          ) : (
            // Split View: File Tree + File Viewer
            <View style={styles.splitView}>
              {/* Left Panel: File Tree or Search */}
              <View style={styles.leftPanel}>
                {showSearch ? (
                  <FileSearch
                    files={fileTree}
                    onSelectFile={handleFileSelect}
                    recentFiles={recentFiles}
                  />
                ) : (
                  <FileTree
                    files={fileTree}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile || undefined}
                  />
                )}
              </View>

              {/* Right Panel: File Viewer */}
              <View style={styles.rightPanel}>
                {selectedFile && selectedFileContent ? (
                  <FileViewer
                    filePath={selectedFile}
                    content={selectedFileContent}
                  />
                ) : (
                  <View style={styles.viewerEmpty}>
                    <Text style={styles.viewerEmptyIcon}>👈</Text>
                    <Text style={styles.viewerEmptyText}>
                      Select a file to view
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  sheetBackground: {
    backgroundColor: tokens.colors.background.base,
  },
  handleIndicator: {
    backgroundColor: tokens.colors.neutral[400],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.text.primary,
  },
  fileCountBadge: {
    backgroundColor: tokens.colors.primary[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: tokens.spacing[2],
  },
  fileCountText: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.primary[700],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surface[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: tokens.colors.primary[100],
  },
  iconButtonText: {
    fontSize: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.surface[1],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: tokens.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: tokens.spacing[4],
  },
  emptyTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.bold as any,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[2],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    width: width * 0.3,
    borderRightWidth: 1,
    borderRightColor: tokens.colors.border.subtle,
    backgroundColor: tokens.colors.background.base,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: tokens.colors.code.background,
  },
  viewerEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[8],
  },
  viewerEmptyIcon: {
    fontSize: 48,
    marginBottom: tokens.spacing[3],
  },
  viewerEmptyText: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.code.text,
    textAlign: 'center',
  },
});
