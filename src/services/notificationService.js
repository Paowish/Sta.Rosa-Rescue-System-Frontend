// src/services/notificationService.js
class NotificationService {
    constructor() {
        this.listeners = [];
        this.isSoundPlaying = false;
        this.audio = null;
        this.currentNotificationId = null;
        this.isPopupShowing = false;
        this.soundIntervalRef = null;
        this.playAttempts = 0;

        // ✅ Load dismissed notifications from localStorage
        this.dismissedNotificationIds = this.loadDismissedIds();
        this.shownNotificationIds = this.loadShownIds();
    }

    // ✅ Load dismissed IDs from localStorage
    loadDismissedIds() {
        try {
            const stored = localStorage.getItem('dismissedNotificationIds');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    }

    // ✅ Save dismissed IDs to localStorage
    saveDismissedIds() {
        try {
            localStorage.setItem('dismissedNotificationIds', JSON.stringify([...this.dismissedNotificationIds]));
        } catch (e) {
            console.warn('Could not save dismissed IDs:', e);
        }
    }

    // ✅ Load shown IDs from localStorage
    loadShownIds() {
        try {
            const stored = localStorage.getItem('shownNotificationIds');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    }

    // ✅ Save shown IDs to localStorage
    saveShownIds() {
        try {
            localStorage.setItem('shownNotificationIds', JSON.stringify([...this.shownNotificationIds]));
        } catch (e) {
            console.warn('Could not save shown IDs:', e);
        }
    }

    // Initialize audio
    initAudio() {
        if (!this.audio) {
            try {
                this.audio = new Audio('/emergencysound.mp3');
                this.audio.preload = 'auto';
                this.audio.loop = true;
                this.audio.addEventListener('error', (e) => {
                    console.warn('⚠️ Emergency sound could not be loaded:', e);
                });
                console.log('🔊 Emergency sound loaded successfully');
            } catch (error) {
                console.warn('⚠️ Could not create audio element:', error);
            }
        }
        return this.audio;
    }

    // ✅ Play sound continuously
    playSound() {
        this.stopSound();

        try {
            const audio = this.initAudio();

            if (audio) {
                audio.currentTime = 0;

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('🔊 Emergency sound started playing (looping)');
                            this.isSoundPlaying = true;
                            this.playAttempts = 0;
                        })
                        .catch((error) => {
                            console.warn('⚠️ Audio autoplay blocked:', error);
                            this.isSoundPlaying = false;
                            this.playAttempts++;

                            if (this.playAttempts < 3) {
                                const playOnInteraction = () => {
                                    this.playSound();
                                    document.removeEventListener('click', playOnInteraction);
                                    document.removeEventListener('touchstart', playOnInteraction);
                                };
                                document.addEventListener('click', playOnInteraction);
                                document.addEventListener('touchstart', playOnInteraction);
                            }
                        });
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not play notification sound:', error);
            this.isSoundPlaying = false;
        }
    }

    // ✅ Stop sound completely
    stopSound() {
        if (this.soundIntervalRef) {
            clearInterval(this.soundIntervalRef);
            this.soundIntervalRef = null;
        }

        try {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
                this.isSoundPlaying = false;
                this.playAttempts = 0;
                console.log('🔇 Emergency sound stopped');
            }
        } catch (error) {
            console.warn('⚠️ Could not stop notification sound:', error);
        }
    }

    // ✅ Show notification
    showNotification(notification) {
        const notificationId = notification._id;

        // ✅ Check if already dismissed
        if (this.isDismissed(notificationId)) {
            console.log('⏭️ Skipping dismissed notification:', notificationId);
            return;
        }

        // ✅ Check if already shown
        if (this.hasBeenShown(notificationId)) {
            console.log('⏭️ Skipping already shown notification:', notificationId);
            return;
        }

        this.currentNotificationId = notificationId;
        this.isPopupShowing = true;

        // ✅ Mark as shown and save
        this.markAsShown(notificationId);
        this.playSound();

        this.notifyListeners({
            type: 'show',
            notification: notification,
            isPopupShowing: true
        });
    }

    // ✅ Dismiss notification - ONLY CALLED WHEN X IS CLICKED
    dismissNotification() {
        this.stopSound();

        if (this.currentNotificationId) {
            // ✅ Add to dismissed set and save
            this.dismissedNotificationIds.add(this.currentNotificationId);
            this.saveDismissedIds();
            console.log('✅ Notification dismissed and saved:', this.currentNotificationId);
        }

        this.isPopupShowing = false;
        this.currentNotificationId = null;

        this.notifyListeners({
            type: 'dismiss',
            isPopupShowing: false
        });
    }

    // ✅ Check if notification has been shown
    hasBeenShown(notificationId) {
        return this.shownNotificationIds.has(notificationId);
    }

    // ✅ Check if notification has been dismissed
    isDismissed(notificationId) {
        return this.dismissedNotificationIds.has(notificationId);
    }

    // ✅ Mark notification as shown
    markAsShown(notificationId) {
        this.shownNotificationIds.add(notificationId);
        this.saveShownIds();
    }

    // ✅ Check if popup is showing
    isPopupActive() {
        return this.isPopupShowing;
    }

    // ✅ Get current notification
    getCurrentNotification() {
        return this.currentNotification;
    }

    // --- Listener system ---
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    notifyListeners(data) {
        this.listeners.forEach(callback => callback(data));
    }

    // ✅ Reset for new notification
    resetForNewNotification() {
        this.isPopupShowing = false;
        this.stopSound();
    }

    // ✅ Clear all dismissed notifications (for testing)
    clearDismissed() {
        this.dismissedNotificationIds.clear();
        this.saveDismissedIds();
        this.shownNotificationIds.clear();
        this.saveShownIds();
        console.log('🗑️ Cleared all dismissed notifications');
    }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;