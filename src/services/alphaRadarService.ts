import { Post } from '../types';
import { api } from './api';

/**
 * Alpha Radar Service
 * Handles monetization logic, scroll injection, and indexing.
 */

interface BoostRule {
    multiplier: number;
    probability: number; // 0 to 1
    durationHours: number;
}

const BOOST_RULES: Record<string, BoostRule> = {
    'x2': { multiplier: 2, probability: 0.1, durationHours: 24 },
    'x5': { multiplier: 5, probability: 0.05, durationHours: 48 },
    'x10': { multiplier: 10, probability: 0.02, durationHours: 72 },
};

export class AlphaRadarService {
    /**
     * Scroll Injection Algorithm
     * Inject boosted posts into a feed based on probability and tier.
     */
    static injectBoostedPosts(organicPosts: any[], boostedPosts: any[]): any[] {
        const result = [...organicPosts];
        
        // Simple injection logic: every 3-5 posts, insert a boosted post
        boostedPosts.forEach((boosted, index) => {
            const position = (index + 1) * 3 + Math.floor(Math.random() * 2);
            if (position < result.length) {
                result.splice(position, 0, boosted);
            } else {
                result.push(boosted);
            }
        });

        return result;
    }

    /**
     * Web3 Indexer (Mock)
     * Simulates listening for smart contract events (Staking, USDT Boost).
     */
    static async getLiveBoostEvents() {
        // In reality, this would query a database populated by an ethers.js listener
        return [
            { id: 'b1', projectId: 'pid1', type: 'USDT_BOOST', multiplier: 10, timestamp: Date.now() },
            { id: 'b2', projectId: 'pid2', type: 'STAKE_BOOST', multiplier: 2, timestamp: Date.now() - 3600000 },
        ];
    }

    /**
     * Gatekeeper Check
     * Verify if a user holds the required $50 $ALPHA to create a project.
     */
    static async checkGatekeeperStatus(walletAddress: string): Promise<boolean> {
        console.log(`Checking $ALPHA balance for gatekeeper: ${walletAddress}`);
        // Mocking true for development
        return true; 
    }

    /**
     * Founder Submission
     * Allows founders to submit their project for verification.
     */
    static async submitProject(projectData: any) {
        try {
            // Uses api.ts interceptor — JWT is attached automatically from sessionStorage
            const response = await api.post('/api/projects/manifesto', projectData);
            return response.data;
        } catch (error) {
            console.error("Project submission error:", error);
            return { success: false, error: "Network error" };
        }
    }

    static async getScreenerData() {
        try {
            const response = await api.get('/api/projects/screener');
            return response.data;
        } catch (error) {
            console.error("Screener fetch error:", error);
            return [];
        }
    }

    static async getAllProjects() {
        try {
            const response = await api.get('/api/projects');
            return response.data;
        } catch (error) {
            console.error("All Projects fetch error:", error);
            return [];
        }
    }

    static async getProject(ownerId: string) {
        try {
            const response = await api.get(`/api/projects/${ownerId}`);
            return response.data;
        } catch (error) {
            console.error("Project fetch error:", error);
            return null;
        }
    }

    /**
     * Admin: Update Project Status
     */
    static async updateProjectStatus(projectId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', verify: boolean = false) {
        console.log(`Updating project ${projectId} to ${status} (Verified: ${verify})`);
        return { success: true };
    }

    /**
     * Admin: Ad Promotion
     */
    static async promoteProjectToAd(projectId: string, placement: 'SIDEBAR' | 'TIMELINE' | 'BOTH') {
        console.log(`Promoting project ${projectId} to AD with placement: ${placement}`);
        return { success: true };
    }

    /**
     * Fetch Ads
     */
    static async getAds(placement: 'SIDEBAR' | 'TIMELINE') {
        // Mocking ad projects
        return [
            {
                id: 'ad1',
                name: 'AlphaBAG Premium',
                symbol: 'BAG',
                description: 'The ultimate command center for degens. Unlock the full potential of your portfolio.',
                logoUrl: 'https://placeholder.com/64',
                contractAddress: '0x123...abc',
                isAd: true,
                isVerified: true
            }
        ];
    }

    /**
     * Social Economy Engine
     * Calculates points awarded for engagements.
     */
    static calculateEngagementPoints(type: 'LIKE' | 'COMMENT' | 'SHARE', multiplier: number = 1): number {
        const basePoints = {
            'LIKE': 1,
            'COMMENT': 5,
            'SHARE': 10
        };
        return (basePoints[type] || 0) * multiplier;
    }
}
