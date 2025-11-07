import React from 'react';
import { GiftedChat, IMessage, User, Send, Bubble } from 'react-native-gifted-chat';
import { colors, typography } from '../tokens';

/**
 * Chat Component
 *
 * Wrapper for React Native Gifted Chat with MobVibe token theming.
 * Provides a complete chat UI with customizable styling and behavior.
 *
 * Features:
 * - Token-based theming
 * - Accessible design
 * - Custom message bubbles
 * - Typing indicators
 * - Quick replies support
 *
 * @example
 * import { Chat } from '@/ui/adapters';
 *
 * const [messages, setMessages] = useState([]);
 *
 * <Chat
 *   messages={messages}
 *   onSend={(newMessages) => setMessages(prev => [...prev, ...newMessages])}
 *   user={{ _id: 1, name: 'User' }}
 * />
 */

export interface ChatProps {
  /** Array of message objects */
  messages: IMessage[];
  /** Callback when sending messages */
  onSend: (messages: IMessage[]) => void;
  /** Current user object */
  user: User;
  /** Placeholder text for input */
  placeholder?: string;
  /** Show user avatar */
  showUserAvatar?: boolean;
  /** Custom avatar renderer */
  renderAvatar?: any;
  /** Custom bubble renderer */
  renderBubble?: any;
  /** Custom input toolbar renderer */
  renderInputToolbar?: any;
  /** Custom send button renderer */
  renderSend?: any;
  /** Show typing indicator */
  isTyping?: boolean;
  /** Scroll to bottom component */
  scrollToBottomComponent?: () => React.ReactElement;
  /** Additional Gifted Chat props */
  [key: string]: any;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  onSend,
  user,
  placeholder = 'Type a message...',
  showUserAvatar = true,
  ...props
}) => {
  return (
    <GiftedChat
      messages={messages}
      onSend={(msgs) => onSend(msgs as IMessage[])}
      user={user}
      placeholder={placeholder}
      showUserAvatar={showUserAvatar}
      // Text input styling
      textInputStyle={{
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.md,
        color: colors.text.primary,
        paddingTop: 8,
        paddingBottom: 8,
      }}
      // Container styling
      messagesContainerStyle={{
        backgroundColor: colors.background.base,
      }}
      // Quick replies styling
      quickReplyStyle={{
        borderRadius: 8,
        borderColor: colors.border.base,
      }}
      quickReplyTextStyle={{
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        color: colors.primary[600],
      }}
      // Composer styling
      composerStyle={{
        borderWidth: 1,
        borderColor: colors.border.base,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingTop: 8,
        marginHorizontal: 8,
      }}
      // Default bubble styling (can be overridden with renderBubble)
      renderBubble={(bubbleProps) => (
        <Bubble
          {...bubbleProps}
          wrapperStyle={{
            left: {
              backgroundColor: colors.surface[2],
            },
            right: {
              backgroundColor: colors.primary[500],
            },
          }}
          textStyle={{
            left: {
              color: colors.text.primary,
              fontFamily: typography.fontFamily.body,
            },
            right: {
              color: '#FFFFFF',
              fontFamily: typography.fontFamily.body,
            },
          }}
          timeTextStyle={{
            left: {
              color: colors.text.tertiary,
              fontSize: typography.fontSize.xs,
            },
            right: {
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: typography.fontSize.xs,
            },
          }}
        />
      )}
      // Default send button styling (can be overridden with renderSend)
      renderSend={(sendProps) => (
        <Send
          {...sendProps}
          containerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 12,
          }}
          textStyle={{
            color: colors.primary[600],
            fontWeight: '600',
            fontSize: typography.fontSize.md,
          }}
        />
      )}
      // Accessibility
      accessible
      accessibilityLabel="Chat conversation"
      {...props}
    />
  );
};

// Re-export types for convenience
export type { IMessage, User } from 'react-native-gifted-chat';
