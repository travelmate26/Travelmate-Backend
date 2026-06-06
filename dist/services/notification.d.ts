export type NotificationType = 'service_purchase' | 'booking' | 'admin_alert' | 'system';
export declare const NotificationService: {
    /**
     * Sends a push notification via Firebase and stores it in the database.
     */
    sendNotification(userId: string, title: string, body: string, type: NotificationType, data?: Record<string, string>): Promise<any>;
    /**
     * Helper to send notification to all Admins
     */
    notifyAdmins(title: string, body: string, type: NotificationType, data?: Record<string, string>): Promise<void>;
};
//# sourceMappingURL=notification.d.ts.map