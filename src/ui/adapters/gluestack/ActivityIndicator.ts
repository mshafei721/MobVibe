/**
 * ActivityIndicator Adapter - React Native Direct Wrapper
 *
 * Uses React Native ActivityIndicator directly as it's simple and sufficient.
 * gluestack has a Spinner component, but we need direct control for our
 * custom Spinner primitive's accessibility implementation.
 *
 * Note: This is intentionally NOT using gluestack - wrapping a simple component
 * adds no value and our Spinner primitive handles the accessibility layer.
 */

import { ActivityIndicator as RNActivityIndicator } from 'react-native';
import type { AdapterActivityIndicatorProps } from '../types';

export const ActivityIndicator = RNActivityIndicator as React.ComponentType<AdapterActivityIndicatorProps>;
