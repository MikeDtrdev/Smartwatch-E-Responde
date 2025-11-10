import { database } from '../firebaseConfig';
import { ref, get, update } from 'firebase/database';

type SOSAlertType = 'manual' | 'proximity' | 'shake' | 'theft';

export interface SOSReport {
  id: string;
  reportId: string;
  timestamp: number;
  type: SOSAlertType;
  userId: string;
  userEmail?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  message: string;
  deviceId?: string;
  status: string;
  responseTime?: number;
  responderId?: string;
  firebaseKey?: string;
  triggerSource?: string;
  createdVia?: string;
  reporterName?: string;
  crimeType?: string;
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

      const crimeReportsRef = ref(database, 'civilian/civilian crime reports');
      const snapshot = await get(crimeReportsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const reports = snapshot.val() as Record<string, any>;
      const flattenedAlerts: SOSReport[] = [];

      Object.entries(reports).forEach(([reportId, rawReport]) => {
        if (!rawReport) {
          return;
        }

        const triggerMeta = `${rawReport.triggerSource ?? ''} ${rawReport.createdVia ?? ''}`.toLowerCase();
        if (!triggerMeta.includes('smartwatch')) {
          return;
        }

        const type = this.resolveAlertType(rawReport.triggerSource, rawReport.createdVia, rawReport.crimeType);
        const reporterUid: string = rawReport.reporterUid ?? rawReport.userId ?? 'unknown';
        const timestamp: number =
          typeof rawReport.timestamp === 'number'
            ? rawReport.timestamp
            : Date.parse(rawReport.dateTime ?? rawReport.createdAt ?? '') || Date.now();

        flattenedAlerts.push({
          id: rawReport.id ?? reportId,
          reportId,
          timestamp,
          type,
          userId: reporterUid,
          userEmail: rawReport.userEmail,
          location: {
            latitude: rawReport.location?.latitude ?? 0,
            longitude: rawReport.location?.longitude ?? 0,
            address: rawReport.location?.address,
          },
          message: rawReport.description ?? '',
          deviceId: rawReport.deviceId,
          status: rawReport.status ?? 'pending',
          responseTime: rawReport.responseTime,
          responderId: rawReport.responderId,
          firebaseKey: reportId,
          triggerSource: rawReport.triggerSource,
          createdVia: rawReport.createdVia,
          reporterName: rawReport.reporterName,
          crimeType: rawReport.crimeType,
        });
      });

      flattenedAlerts.sort((a, b) => {
        const aTime = a.timestamp ?? 0;
        const bTime = b.timestamp ?? 0;
        return aTime - bTime;
      });

      return flattenedAlerts.slice(-limit);
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
        activeAlerts: alerts.filter(alert => this.normalizeStatus(alert.status) === 'active').length,
        respondedAlerts: alerts.filter(alert => this.normalizeStatus(alert.status) === 'responded').length,
        resolvedAlerts: alerts.filter(alert => this.normalizeStatus(alert.status) === 'resolved').length,
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
  async updateAlertStatus(userId: string, reportId: string, status: string, responderId?: string): Promise<boolean> {
    try {
      if (!database) {
        console.warn('Admin Reporting Service: Database not available');
        return false;
      }

      const globalRef = ref(database, `civilian/civilian crime reports/${reportId}`);
      const userRef = ref(database, `civilian/civilian account/${userId}/crime reports/${reportId}`);
      const nowIso = new Date().toISOString();
      const nowTs = Date.now();

      const updates: Record<string, unknown> = {
        status,
        updatedAt: nowTs,
        statusUpdatedAt: nowIso,
      };

      if (responderId) {
        updates.responderId = responderId;
        updates.statusUpdatedBy = responderId;
      }

      if (status.toLowerCase() === 'responded' || status.toLowerCase() === 'resolved') {
        updates.responseTime = nowTs;
      }

      await Promise.all([update(globalRef, updates), update(userRef, updates)]);
      console.log('Admin Reporting Service: Alert status updated for report', reportId);
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
      if (!alert.responseTime) {
        return sum;
      }
      return sum + (alert.responseTime - alert.timestamp);
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

  private resolveAlertType(
    triggerSource?: string,
    createdVia?: string,
    crimeType?: string
  ): SOSAlertType {
    const source = `${triggerSource ?? ''} ${createdVia ?? ''} ${crimeType ?? ''}`.toLowerCase();

    if (source.includes('theft')) {
      return 'theft';
    }

    if (source.includes('proximity')) {
      return 'proximity';
    }

    if (source.includes('shake')) {
      return 'shake';
    }

    return 'manual';
  }

  private normalizeStatus(status: string): 'active' | 'responded' | 'resolved' {
    const normalized = status.toLowerCase();

    if (['responded', 'acknowledged', 'in_progress'].includes(normalized)) {
      return 'responded';
    }

    if (['resolved', 'case resolved', 'closed', 'completed'].includes(normalized)) {
      return 'resolved';
    }

    return 'active';
  }
}

export default new AdminReportingService();
