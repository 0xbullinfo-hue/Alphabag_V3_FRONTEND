import { api } from './api';

export class AlphaRadarService {
    /**
     * Scroll Injection Algorithm
     */
    static injectBoostedPosts(organicPosts: any[], boostedPosts: any[]): any[] {
        const result = [...organicPosts];
        boostedPosts.forEach((boosted, index) => {
            const position = (index + 1) * 3;
            if (position < result.length) {
                result.splice(position, 0, boosted);
            } else {
                result.push(boosted);
            }
        });
        return result;
    }

    /**
     * Live Boost Events from Backend
     */
    static async getLiveBoostEvents() {
        try {
            const res = await api.get('/api/projects/boost-events');
            return res.data || [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Gatekeeper Check - Live verification against backend/on-chain
     */
    static async checkGatekeeperStatus(walletAddress: string): Promise<boolean> {
        if (!walletAddress) return false;
        try {
            const res = await api.get(`/api/projects/gatekeeper/${walletAddress}`);
            return Boolean(res.data?.isQualified || res.data?.qualified);
        } catch (e) {
            console.warn("Gatekeeper status check failed:", e);
            return false;
        }
    }

    /**
     * Founder Submission
     */
    static async submitProject(projectData: any) {
        try {
            const response = await api.post('/api/projects/manifesto', projectData);
            return response.data;
        } catch (error: any) {
            console.error("Project submission error:", error);
            return { success: false, error: error?.response?.data?.error || "Network error" };
        }
    }

    static async getScreenerData() {
        try {
            const response = await api.get('/api/projects/screener');
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    static async getAllProjects() {
        try {
            const response = await api.get('/api/projects');
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    static async getProject(ownerId: string) {
        try {
            const response = await api.get(`/api/projects/${ownerId}`);
            return response.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Admin: Update Project Status
     */
    static async updateProjectStatus(projectId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', verify: boolean = false) {
        try {
            const res = await api.patch(`/api/projects/${projectId}/status`, { status, verified: verify });
            return res.data;
        } catch (e: any) {
            return { success: false, error: e?.message };
        }
    }

    /**
     * Admin: Ad Promotion
     */
    static async promoteProjectToAd(projectId: string, placement: 'SIDEBAR' | 'TIMELINE' | 'BOTH') {
        try {
            const res = await api.post(`/api/projects/${projectId}/promote`, { placement });
            return res.data;
        } catch (e: any) {
            return { success: false, error: e?.message };
        }
    }

    /**
     * Fetch Ads from live API
     */
    static async getAds(placement: 'SIDEBAR' | 'TIMELINE') {
        try {
            const res = await api.get('/api/projects/ads', { params: { placement } });
            return res.data || [];
        } catch (e) {
            return [];
        }
    }

    static calculateEngagementPoints(type: 'LIKE' | 'COMMENT' | 'SHARE', multiplier: number = 1): number {
        const basePoints = {
            'LIKE': 1,
            'COMMENT': 5,
            'SHARE': 10
        };
        return (basePoints[type] || 0) * multiplier;
    }
}
