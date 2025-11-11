/**
 * FileSearch Component
 * Search files by name with fuzzy matching
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { tokens } from '@/src/ui/tokens';
import { searchFiles } from '@/utils/fileTree';
import { getFileIcon } from '@/constants/fileIcons';

export interface FileSearchProps {
  files: Record<string, string>;
  onSelectFile: (path: string) => void;
  recentFiles?: string[];
}

export function FileSearch({
  files,
  onSelectFile,
  recentFiles = [],
}: FileSearchProps) {
  const [query, setQuery] = useState('');

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchFiles(files, query);
  }, [files, query]);

  // Filter recent files to only those that exist
  const validRecentFiles = useMemo(() => {
    return recentFiles.filter((path) => files[path]);
  }, [recentFiles, files]);

  // Clear search
  const handleClear = () => {
    setQuery('');
  };

  // Handle file selection
  const handleSelectFile = (path: string) => {
    onSelectFile(path);
    setQuery(''); // Clear search after selection
  };

  // Highlight matching characters
  const highlightMatch = (text: string, match: string) => {
    if (!match) return text;

    const lowerText = text.toLowerCase();
    const lowerMatch = match.toLowerCase();
    const parts: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;

    let matchIndex = lowerText.indexOf(lowerMatch);
    if (matchIndex !== -1) {
      if (matchIndex > 0) {
        parts.push({ text: text.substring(0, matchIndex), highlight: false });
      }
      parts.push({
        text: text.substring(matchIndex, matchIndex + match.length),
        highlight: true,
      });
      lastIndex = matchIndex + match.length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), highlight: false });
    }

    return parts.length > 0 ? parts : [{ text, highlight: false }];
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search files..."
          placeholderTextColor={tokens.colors.text.tertiary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {query.trim().length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <FileSearchResult
              path={item}
              query={query}
              onSelect={handleSelectFile}
              highlightMatch={highlightMatch}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No files found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Recent Files Section
        validRecentFiles.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Files</Text>
            {validRecentFiles.slice(0, 5).map((path) => (
              <FileSearchResult
                key={path}
                path={path}
                query=""
                onSelect={handleSelectFile}
                highlightMatch={highlightMatch}
              />
            ))}
          </View>
        )
      )}
    </View>
  );
}

interface FileSearchResultProps {
  path: string;
  query: string;
  onSelect: (path: string) => void;
  highlightMatch: (
    text: string,
    match: string
  ) => { text: string; highlight: boolean }[];
}

function FileSearchResult({
  path,
  query,
  onSelect,
  highlightMatch,
}: FileSearchResultProps) {
  const fileName = path.split('/').pop() || path;
  const directory = path.substring(0, path.lastIndexOf('/'));

  const highlightedName = highlightMatch(fileName, query);

  return (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onSelect(path)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <Text style={styles.resultIcon}>{getFileIcon(fileName)}</Text>

      {/* File Info */}
      <View style={styles.resultInfo}>
        {/* File Name with Highlights */}
        <Text style={styles.resultName}>
          {highlightedName.map((part, idx) => (
            <Text
              key={idx}
              style={part.highlight ? styles.highlight : undefined}
            >
              {part.text}
            </Text>
          ))}
        </Text>

        {/* Directory Path */}
        {directory && (
          <Text style={styles.resultPath} numberOfLines={1}>
            {directory}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.base,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface[1],
    borderRadius: 8,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: tokens.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: tokens.spacing[1],
  },
  clearIcon: {
    fontSize: 16,
    color: tokens.colors.text.tertiary,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: tokens.spacing[2],
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.medium as any,
    color: tokens.colors.text.primary,
    marginBottom: 2,
  },
  resultPath: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.tertiary,
  },
  highlight: {
    backgroundColor: tokens.colors.warning[200],
    color: tokens.colors.text.primary,
    fontWeight: tokens.typography.fontWeight.bold as any,
  },
  emptyContainer: {
    padding: tokens.spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.tertiary,
  },
  recentSection: {
    paddingTop: tokens.spacing[2],
  },
  sectionTitle: {
    fontSize: tokens.typography.fontSize.xs,
    fontWeight: tokens.typography.fontWeight.semibold as any,
    color: tokens.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
  },
});
