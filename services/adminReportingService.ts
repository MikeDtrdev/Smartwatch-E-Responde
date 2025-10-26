import { database } from '../firebaseConfig';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';

export interface SOSReport {
  id: string;
  timestamp: number;
  type: 'manual' | 'proximity' | 'shake';
  userId: string;
  userEmail: string;
  location: {
    latitude: number;
    longitude: number;
  };
  message: string;
  deviceId: string;
  status: 'active' | 'responded' | 'resolved';
  responseTime?: number;
  responderId?: string;
}

export interface AdminStats {
  totalSOSAlerts: number;
  activeAlerts: number;
  respondedAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number;
  alertsByType: {
    manual: number;
    proximity: number;
    shake: number;
  };
  recentAlerts: SOSReport[];
}

class AdminReportingService {
  /**
   * Get all SOS alerts for admin dashboard
   */
  async getAllSOSAlerts(limit: number = 50): Promise<SOSReport[]> {
    try {
      if (!database) {
        console.warn('Admin Reporting Service: Database not available');
        return [];
      }

      const sosRef = ref(database, 'sos_alerts');
      const sosQuery = query(sosRef, orderByChild('timestamp'), limitToLast(limit));
      
      const snapshot = await get(sosQuery);
      
      if (snapshot.exists()) {
        const alerts = snapshot.val();
        return Object.values(alerts).map((alert: any) => ({
          ...alert,
          status: alert.status || 'active'
        })) as SOSReport[];
      }

      return [];
    } catch (error) {
      console.error('Admin Reporting Service: Failed to get SOS alerts:', error);
      return [];
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      const alerts = await this.getAllSOSAlerts(100);
      
      const stats: AdminStats = {
        totalSOSAlerts: alerts.length,
        activeAlerts: alerts.filter(alert => alert.status === 'active').length,
        respondedAlerts: alerts.filter(alert => alert.status === 'responded').length,
        resolvedAlerts: alerts.filter(alert => alert.status === 'resolved').length,
        averageResponseTime: this.calculateAverageResponseTime(alerts),
        alertsByType: {
          manual: alerts.filter(alert => alert.type === 'manual').length,
          proximity: alerts.filter(alert => alert.type === 'proximity').length,
          shake: alerts.filter(alert => alert.type === 'shake').length
        },
        recentAlerts: alerts.slice(-10).reverse()
      };

      return stats;
    } catch (error) {
      console.error('Admin Reporting Service: Failed to get admin stats:', error);
      return {
        totalSOSAlerts: 0,
        activeAlerts: 0,
        respondedAlerts: 0,
        resolvedAlerts: 0,
        averageResponseTime: 0,
        alertsByType: { manual: 0, proximity: 0, shake: 0 },
        recentAlerts: []
      };
    }
  }

  /**
   * Update SOS alert status
   */
  async updateAlertStatus(alertId: string, status: 'active' | 'responded' | 'resolved', responderId?: string): Promise<boolean> {
    try {
      if (!database) {
        console.warn('Admin Reporting Service: Database not available');
        return false;
      }

      const alertRef = ref(database, `sos_alerts/${alertId}`);
      const updates: any = {
        status,
        updatedAt: Date.now()
      };

      if (responderId) {
        updates.responderId = responderId;
      }

      if (status === 'responded') {
        updates.responseTime = Date.now();
      }

      await set(alertRef, updates);
      console.log('Admin Reporting Service: Alert status updated');
      return true;
    } catch (error) {
      console.error('Admin Reporting Service: Failed to update alert status:', error);
      return false;
    }
  }

  /**
   * Get alerts by location (for map view)
   */
  async getAlertsByLocation(): Promise<Array<SOSReport & { distance?: number }>> {
    try {
      const alerts = await this.getAllSOSAlerts();
      return alerts.filter(alert => alert.location).map(alert => ({
        ...alert,
        distance: null // Distance calculation removed - no reference point
      }));
    } catch (error) {
      console.error('Admin Reporting Service: Failed to get alerts by location:', error);
      return [];
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(alerts: SOSReport[]): number {
    const respondedAlerts = alerts.filter(alert => alert.responseTime);
    if (respondedAlerts.length === 0) return 0;

    const totalResponseTime = respondedAlerts.reduce((sum, alert) => {
      return sum + (alert.responseTime! - alert.timestamp);
    }, 0);

    return totalResponseTime / respondedAlerts.length / 1000; // Convert to seconds
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default new AdminReportingService();
