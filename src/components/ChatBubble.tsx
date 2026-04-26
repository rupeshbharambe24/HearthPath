import React from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bubbleVariants } from '@/lib/animations';
import { useSignedVoiceMessage } from '@/hooks/useSignedVoiceMessage';

interface ChatBubbleProps {
  message: string;
  isOwn: boolean;
  timestamp: string;
  senderName?: string;
  readAt?: string | null;
  contentType?: string;
  messageId?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isOwn,
  timestamp,
  senderName,
  readAt,
  contentType = 'text',
  messageId,
}) => {
  const isVoice = contentType === 'voice';

  return (
    <motion.div
      className={cn(
        "flex mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className={cn(
          "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm",
          isOwn
            ? "bg-romantic-red text-white rounded-br-md"
            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-100 dark:border-gray-600"
        )}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.15 }}
      >
        {!isOwn && senderName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
            {senderName}
          </p>
        )}
        {isVoice && messageId ? (
          <VoiceContent messageId={messageId} isOwn={isOwn} />
        ) : (
          <p className="text-sm leading-relaxed">{message}</p>
        )}
        <div className={cn(
          "flex items-center gap-1 mt-1",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <p className={cn(
            "text-xs",
            isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
          )}>
            {timestamp}
          </p>
          {isOwn && (
            readAt ? (
              <CheckCheck
                className="h-3 w-3 text-sky-200"
                aria-label="Read"
              />
            ) : (
              <Check
                className="h-3 w-3 text-white/70"
                aria-label="Sent"
              />
            )
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

function VoiceContent({ messageId, isOwn }: { messageId: string; isOwn: boolean }) {
  const { data, isLoading, error } = useSignedVoiceMessage(messageId, true);
  if (isLoading) {
    return <div className="h-8 w-40 bg-muted/40 rounded animate-pulse" />;
  }
  if (error || !data) {
    return (
      <div className={cn(
        "text-xs italic",
        isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
      )}>
        (voice note unavailable)
      </div>
    );
  }
  return (
    <audio
      controls
      src={data.url}
      className="max-w-xs w-full"
      preload="metadata"
    />
  );
}

export default ChatBubble;
