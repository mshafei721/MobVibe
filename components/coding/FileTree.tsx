/**
 * FileTree Component
 * Displays a hierarchical file tree with expand/collapse functionality
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { tokens } from '@/src/ui/tokens';
import { buildFileTree, countFiles, TreeNode } from '@/utils/fileTree';
import { getFileIcon, getFolderIcon } from '@/constants/fileIcons';

export interface FileTreeProps {
  files: Record<string, string>; // path -> content
  onFileSelect: (path: string) => void;
  selectedFile?: string;
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  // Build tree structure
  const tree = useMemo(() => buildFileTree(files), [files]);

  // Track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Render empty state
  if (Object.keys(files).length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No files yet</Text>
        <Text style={styles.emptySubtext}>
          Files will appear here as they are created
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {tree.children?.map((node) => (
        <TreeNodeItem
          key={node.path}
          node={node}
          level={0}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onToggleFolder={toggleFolder}
          onSelectFile={onFileSelect}
        />
      ))}
    </ScrollView>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  expandedFolders: Set<string>;
  selectedFile?: string;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
}

function TreeNodeItem({
  node,
  level,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onSelectFile,
}: TreeNodeItemProps) {
  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = node.path === selectedFile;
  const fileCount = isFolder ? countFiles(node) : 0;

  const handlePress = () => {
    if (isFolder) {
      onToggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <View>
      {/* Current Node */}
      <TouchableOpacity
        style={[
          styles.item,
          { paddingLeft: tokens.spacing[2] + level * 20 },
          isSelected && styles.itemSelected,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <Text style={styles.icon}>
          {isFolder ? getFolderIcon(isExpanded) : getFileIcon(node.name)}
        </Text>

        {/* Name */}
        <Text
          style={[
            styles.name,
            isSelected && styles.nameSelected,
            isFolder && styles.folderName,
          ]}
          numberOfLines={1}
        >
          {node.name}
        </Text>

        {/* File Count Badge (folders only) */}
        {isFolder && fileCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{fileCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Children (if folder is expanded) */}
      {isFolder && isExpanded && node.children && (
        <View>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedFolders={expandedFolders}
              selectedFile={selectedFile}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[1],
  },
  emptySubtext: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingRight: tokens.spacing[2],
  },
  itemSelected: {
    backgroundColor: `${tokens.colors.primary[500]}15`, // 15% opacity
  },
  icon: {
    fontSize: 16,
    marginRight: tokens.spacing[2],
  },
  name: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.primary,
  },
  nameSelected: {
    color: tokens.colors.primary[600],
    fontWeight: tokens.typography.fontWeight.medium as any,
  },
  folderName: {
    fontWeight: tokens.typography.fontWeight.medium as any,
  },
  badge: {
    backgroundColor: tokens.colors.neutral[200],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: tokens.spacing[1],
  },
  badgeText: {
    fontSize: 10,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.text.secondary,
  },
});
