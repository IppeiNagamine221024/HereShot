import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { searchPlaces, type PlaceResult } from '../lib/mapbox';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from '../constants';
import { colors } from '../theme/colors';
import { fontSize, radius, spacing } from '../theme/layout';

interface Props {
  onSelect: (place: PlaceResult) => void;
}

/**
 * ホーム上部の場所検索窓（要件 FR-MAP-03/04）。
 */
export function PlaceSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const { data, isFetching } = useQuery({
    queryKey: ['places', debounced],
    queryFn: () => searchPlaces(debounced),
    enabled: debounced.trim().length >= 2,
  });

  const showResults = focused && (data?.length ?? 0) > 0;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          placeholder="場所を検索（例: 渋谷、東京タワー）"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          returnKeyType="search"
        />
        {isFetching ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : query.length > 0 ? (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {showResults ? (
        <View style={styles.results}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultItem}
                onPress={() => {
                  onSelect(item);
                  setQuery(item.name);
                  setFocused(false);
                }}
              >
                <Ionicons name="location" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultSub} numberOfLines={1}>
                    {item.fullName}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  results: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 280,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  resultSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
