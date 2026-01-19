'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Info, AlertTriangle, XCircle, Loader2, X } from 'lucide-react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error' | 'loading';
export type NotificationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

interface NotificationProps {
  type: NotificationType;
  title: string;
  message?: string;
  showIcon?: boolean;
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  showIcon = true,
  duration,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  // Usar useCallback para evitar erro de setState durante render
  const handleAutoClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (duration) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            // Usar setTimeout para evitar setState durante render
            setTimeout(() => handleAutoClose(), 0);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, handleAutoClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      default:
        return null;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 dark:bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400';
      case 'info':
        return 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400';
      case 'loading':
        return 'bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/30 text-gray-600 dark:text-gray-400';
      default:
        return '';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'info':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'loading':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative backdrop-blur-xl border rounded-xl shadow-lg overflow-hidden ${getColors()} bg-slate-800/95`}
    >
      <div className="p-4 flex items-start gap-3">
        {showIcon && (
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white">
            {title}
          </h4>
          {message && (
            <p className="text-xs text-gray-200 mt-1">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {duration && (
        <div className="h-1 bg-gray-700">
          <div
            className={`h-full transition-all duration-100 ease-linear ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export default Notification;
