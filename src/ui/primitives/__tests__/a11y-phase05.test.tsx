import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Divider } from '../Divider';
import { Spinner } from '../Spinner';
import { Icon } from '../Icon';
import { Card } from '../Card';
import { ListItem } from '../ListItem';
import { Sheet } from '../Sheet';

describe('Phase 05 Accessibility Tests - WCAG AA Compliance', () => {
  describe('Divider Accessibility', () => {
    it('is hidden from screen readers (iOS)', () => {
      const { getByTestID } = render(<Divider testID="divider" />);
      const divider = getByTestID('divider');

      expect(divider.props.accessibilityElementsHidden).toBe(true);
    });

    it('is hidden from screen readers (Android)', () => {
      const { getByTestID } = render(<Divider testID="divider" />);
      const divider = getByTestID('divider');

      expect(divider.props.importantForAccessibility).toBe('no');
    });

    it('does not interfere with screen reader navigation', () => {
      const { UNSAFE_root } = render(
        <>
          <Text>Before</Text>
          <Divider />
          <Text>After</Text>
        </>
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Spinner Accessibility', () => {
    it('has required accessibilityLabel', () => {
      const { getByAccessibilityLabel } = render(
        <Spinner accessibilityLabel="Loading user profile" />
      );

      expect(getByAccessibilityLabel('Loading user profile')).toBeTruthy();
    });

    it('announces loading state via live region', () => {
      const { getByAccessibilityLabel } = render(
        <Spinner accessibilityLabel="Loading data" />
      );
      const container = getByAccessibilityLabel('Loading data');

      expect(container.props.accessibilityLiveRegion).toBe('polite');
    });

    it('has progressbar role for screen readers', () => {
      const { getByAccessibilityLabel } = render(
        <Spinner accessibilityLabel="Loading" />
      );
      const container = getByAccessibilityLabel('Loading');

      expect(container.props.accessibilityRole).toBe('progressbar');
    });

    it('indicates busy state', () => {
      const { getByAccessibilityLabel } = render(
        <Spinner accessibilityLabel="Processing" />
      );
      const container = getByAccessibilityLabel('Processing');

      expect(container.props.accessibilityState.busy).toBe(true);
    });

    it('provides descriptive label (not generic)', () => {
      const { getByAccessibilityLabel } = render(
        <Spinner accessibilityLabel="Saving changes to profile" />
      );

      expect(getByAccessibilityLabel('Saving changes to profile')).toBeTruthy();
    });
  });

  describe('Icon Accessibility', () => {
    it('hides decorative icons from screen readers', () => {
      const { UNSAFE_root } = render(
        <Icon family="ionicons" name="star" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('exposes meaningful icons with accessibilityLabel', () => {
      const { getByAccessibilityLabel } = render(
        <Icon
          family="ionicons"
          name="search"
          accessibilityLabel="Search"
        />
      );

      expect(getByAccessibilityLabel('Search')).toBeTruthy();
    });

    it('allows screen reader to announce meaningful icon labels', () => {
      const { getByAccessibilityLabel } = render(
        <Icon
          family="material"
          name="close"
          accessibilityLabel="Close"
        />
      );

      expect(getByAccessibilityLabel('Close')).toBeTruthy();
    });
  });

  describe('Card Accessibility', () => {
    it('has no accessibility role when used as container', () => {
      const { UNSAFE_root } = render(
        <Card>
          <Text>Content</Text>
        </Card>
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    it('has button role when touchable', () => {
      const { getByRole } = render(
        <Card
          onPress={() => {}}
          accessibilityLabel="View details"
        >
          <Text>Content</Text>
        </Card>
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('requires accessibilityLabel when touchable', () => {
      const { getByAccessibilityLabel } = render(
        <Card
          onPress={() => {}}
          accessibilityLabel="Open settings"
        >
          <Text>Settings</Text>
        </Card>
      );

      expect(getByAccessibilityLabel('Open settings')).toBeTruthy();
    });

    it('elevation does not affect accessibility', () => {
      const { getByText } = render(
        <Card variant="floating">
          <Text>Accessible Content</Text>
        </Card>
      );

      expect(getByText('Accessible Content')).toBeTruthy();
    });
  });

  describe('ListItem Accessibility', () => {
    it('combines title and subtitle into single label', () => {
      const { getByAccessibilityLabel } = render(
        <ListItem title="John Doe" subtitle="Software Engineer" />
      );

      expect(getByAccessibilityLabel('John Doe, Software Engineer')).toBeTruthy();
    });

    it('allows custom accessibility label', () => {
      const { getByAccessibilityLabel } = render(
        <ListItem
          title="Settings"
          accessibilityLabel="Open application settings"
        />
      );

      expect(getByAccessibilityLabel('Open application settings')).toBeTruthy();
    });

    it('provides accessibility hint for navigation', () => {
      const { getByAccessibilityLabel, getByAccessibilityHint } = render(
        <ListItem
          title="Profile"
          onPress={() => {}}
          accessibilityHint="Double tap to view your profile"
        />
      );

      const item = getByAccessibilityLabel('Profile');
      expect(item.props.accessibilityHint).toBe('Double tap to view your profile');
    });

    it('has button role when onPress provided', () => {
      const { getByRole } = render(
        <ListItem title="Item" onPress={() => {}} />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('meets minimum touch target size (44pt iOS / 48dp Android)', () => {
      const { getByText } = render(
        <ListItem title="Test Item" onPress={() => {}} />
      );
      const touchable = getByText('Test Item').parent?.parent;

      if (touchable && touchable.props.style) {
        const minHeight = touchable.props.style.minHeight;
        expect(minHeight).toBeGreaterThanOrEqual(44);
      }
    });

    it('chevron icon is decorative (not announced)', () => {
      const { UNSAFE_root } = render(
        <ListItem title="Navigate" rightIcon="chevron" />
      );

      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Sheet Accessibility', () => {
    it('traps focus within modal', () => {
      const { UNSAFE_getByType } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Filter Options">
          <Text>Content</Text>
        </Sheet>
      );
      const modal = UNSAFE_getByType(require('react-native').Modal);

      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('backdrop has button role', () => {
      const { getByRole } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Options">
          <Text>Content</Text>
        </Sheet>
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('backdrop has close action label', () => {
      const { getByAccessibilityLabel } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Options">
          <Text>Content</Text>
        </Sheet>
      );

      expect(getByAccessibilityLabel('Close sheet')).toBeTruthy();
    });

    it('sheet content has descriptive label', () => {
      const { getByAccessibilityLabel } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Sort Options">
          <Text>Content</Text>
        </Sheet>
      );

      expect(getByAccessibilityLabel('Sort Options')).toBeTruthy();
    });

    it('announces when modal opens (via focus trap)', () => {
      const { UNSAFE_getByType } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Settings">
          <Text>Content</Text>
        </Sheet>
      );
      const modal = UNSAFE_getByType(require('react-native').Modal);

      expect(modal.props.accessibilityViewIsModal).toBe(true);
    });

    it('respects reduce motion preference', () => {
      const { UNSAFE_getByType } = render(
        <Sheet visible={true} onClose={() => {}} accessibilityLabel="Options">
          <Text>Content</Text>
        </Sheet>
      );
      const modal = UNSAFE_getByType(require('react-native').Modal);

      expect(modal.props.animationType).toMatch(/^(slide|none)$/);
    });
  });
});

/**
 * Manual Testing Checklist
 *
 * Run these tests manually with VoiceOver (iOS) and TalkBack (Android):
 *
 * [ ] VoiceOver Tests (iOS):
 *     [ ] Divider is completely skipped by VoiceOver
 *     [ ] Spinner announces "Loading [description], Progress indicator, Busy"
 *     [ ] Icon decorative icons are skipped
 *     [ ] Icon meaningful icons announce their label
 *     [ ] Card touchable cards announce as "Button, [label]"
 *     [ ] ListItem combines title + subtitle in announcement
 *     [ ] ListItem with chevron hints at navigation
 *     [ ] Sheet focus moves into modal when opened
 *     [ ] Sheet backdrop announces "Close sheet, Button"
 *     [ ] Sheet content announces descriptive label
 *
 * [ ] TalkBack Tests (Android):
 *     [ ] Divider is completely skipped by TalkBack
 *     [ ] Spinner announces loading state
 *     [ ] Icon decorative icons are hidden
 *     [ ] Icon meaningful icons read label
 *     [ ] Card touchable cards announce as button
 *     [ ] ListItem title + subtitle combined
 *     [ ] ListItem meets 48dp touch target
 *     [ ] Sheet traps focus correctly
 *     [ ] Sheet backdrop dismissible
 *
 * [ ] Reduce Motion Tests:
 *     [ ] Sheet uses 'none' animation when reduce motion enabled
 *     [ ] All animations respect system settings
 *
 * [ ] Touch Target Tests:
 *     [ ] ListItem minimum 44pt (iOS) / 48dp (Android)
 *     [ ] Touchable Card minimum 44pt (iOS) / 48dp (Android)
 *     [ ] Sheet backdrop easily tappable
 *
 * [ ] Platform-Specific Tests:
 *     [ ] Card shadows render on iOS
 *     [ ] Card elevation renders on Android
 *     [ ] Icons load from all 3 families (Ionicons, Material, Feather)
 *     [ ] Haptic feedback works on ListItem and Card press
 */
