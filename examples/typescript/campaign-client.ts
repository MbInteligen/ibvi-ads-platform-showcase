/**
 * Campaign Client Example
 * 
 * This TypeScript example demonstrates how the Next.js frontend
 * interacts with the Rust Core API to fetch and display campaigns.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type Platform = 'google' | 'meta';

export type CampaignStatus = 'ENABLED' | 'PAUSED' | 'REMOVED';

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  ctr: number;  // Click-through rate (%)
  cpa: number;  // Cost per acquisition
}

export interface Campaign {
  id: string;
  platform: Platform;
  name: string;
  status: CampaignStatus;
  daily_budget: number;
  currency: string;
  metrics: CampaignMetrics;
}

export interface CampaignFilters {
  platform?: Platform;
  status?: CampaignStatus;
  minBudget?: number;
  maxBudget?: number;
}

export interface CampaignStats {
  total: number;
  enabled: number;
  paused: number;
  totalBudget: number;
  totalSpend: number;
}

// ============================================================================
// API Client
// ============================================================================

export class CampaignClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(baseUrl: string = 'http://localhost:8080', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_API_KEY || '';
  }
  
  /**
   * Fetch all campaigns from the unified API
   * 
   * @returns Array of campaigns from both Google Ads and Meta Ads
   * @throws Error if the request fails
   */
  async getCampaigns(): Promise<Campaign[]> {
    const response = await fetch(`${this.baseUrl}/api/campaigns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      // Enable caching for 5 minutes (matches backend cache)
      next: { revalidate: 300 },
    });
    
    if (!response.ok) {
      throw new Error(
        `Failed to fetch campaigns: ${response.status} ${response.statusText}`
      );
    }
    
    return response.json();
  }
  
  /**
   * Filter campaigns by criteria
   * 
   * @param filters - Filter criteria
   * @returns Filtered campaigns
   */
  filterCampaigns(
    campaigns: Campaign[], 
    filters: CampaignFilters
  ): Campaign[] {
    return campaigns.filter(campaign => {
      if (filters.platform && campaign.platform !== filters.platform) {
        return false;
      }
      
      if (filters.status && campaign.status !== filters.status) {
        return false;
      }
      
      if (filters.minBudget && campaign.daily_budget < filters.minBudget) {
        return false;
      }
      
      if (filters.maxBudget && campaign.daily_budget > filters.maxBudget) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Calculate aggregate statistics for campaigns
   * 
   * @param campaigns - Array of campaigns
   * @returns Aggregated statistics
   */
  calculateStats(campaigns: Campaign[]): CampaignStats {
    return campaigns.reduce(
      (stats, campaign) => {
        stats.total++;
        
        if (campaign.status === 'ENABLED') {
          stats.enabled++;
          stats.totalBudget += campaign.daily_budget;
        } else if (campaign.status === 'PAUSED') {
          stats.paused++;
        }
        
        stats.totalSpend += campaign.metrics.cost;
        
        return stats;
      },
      {
        total: 0,
        enabled: 0,
        paused: 0,
        totalBudget: 0,
        totalSpend: 0,
      }
    );
  }
  
  /**
   * Group campaigns by platform
   * 
   * @param campaigns - Array of campaigns
   * @returns Object with campaigns grouped by platform
   */
  groupByPlatform(campaigns: Campaign[]): Record<Platform, Campaign[]> {
    return campaigns.reduce((groups, campaign) => {
      if (!groups[campaign.platform]) {
        groups[campaign.platform] = [];
      }
      groups[campaign.platform].push(campaign);
      return groups;
    }, {} as Record<Platform, Campaign[]>);
  }
}

// ============================================================================
// React Hook
// ============================================================================

import { useEffect, useState } from 'react';

export interface UseCampaignsResult {
  campaigns: Campaign[];
  stats: CampaignStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching and managing campaigns
 * 
 * @param filters - Optional filters to apply
 * @returns Campaign data, loading state, and error
 */
export function useCampaigns(
  filters?: CampaignFilters
): UseCampaignsResult {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const client = new CampaignClient();
  
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allCampaigns = await client.getCampaigns();
      
      const filtered = filters
        ? client.filterCampaigns(allCampaigns, filters)
        : allCampaigns;
      
      setCampaigns(filtered);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCampaigns();
    
    // Refetch every 5 minutes
    const interval = setInterval(fetchCampaigns, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [filters]);
  
  const stats = campaigns.length > 0 
    ? client.calculateStats(campaigns) 
    : null;
  
  return {
    campaigns,
    stats,
    loading,
    error,
    refetch: fetchCampaigns,
  };
}

// ============================================================================
// React Component Example
// ============================================================================

export function CampaignDashboard() {
  const { campaigns, stats, loading, error, refetch } = useCampaigns();
  
  if (loading) {
    return <div>Loading campaigns...</div>;
  }
  
  if (error) {
    return (
      <div className="error">
        <h2>Error loading campaigns</h2>
        <p>{error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      <header>
        <h1>Campaign Dashboard</h1>
        <button onClick={refetch}>Refresh</button>
      </header>
      
      {stats && (
        <div className="stats-grid">
          <StatCard 
            title="Total Campaigns" 
            value={stats.total} 
            icon="📊"
          />
          <StatCard 
            title="Active" 
            value={stats.enabled} 
            icon="✅"
            color="green"
          />
          <StatCard 
            title="Paused" 
            value={stats.paused} 
            icon="⏸️"
            color="orange"
          />
          <StatCard 
            title="Daily Budget" 
            value={`R$ ${stats.totalBudget.toFixed(2)}`} 
            icon="💰"
          />
          <StatCard 
            title="Total Spend" 
            value={`R$ ${stats.totalSpend.toFixed(2)}`} 
            icon="💸"
          />
        </div>
      )}
      
      <CampaignTable campaigns={campaigns} />
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  icon: string;
  color?: 'blue' | 'green' | 'orange';
}) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <table className="campaign-table">
      <thead>
        <tr>
          <th>Platform</th>
          <th>Campaign Name</th>
          <th>Status</th>
          <th>Daily Budget</th>
          <th>Impressions</th>
          <th>Clicks</th>
          <th>Conversions</th>
          <th>CPA</th>
          <th>CTR</th>
        </tr>
      </thead>
      <tbody>
        {campaigns.map(campaign => (
          <tr key={campaign.id}>
            <td>
              <PlatformBadge platform={campaign.platform} />
            </td>
            <td>{campaign.name}</td>
            <td>
              <StatusBadge status={campaign.status} />
            </td>
            <td>
              R$ {campaign.daily_budget.toFixed(2)}
            </td>
            <td>{campaign.metrics.impressions.toLocaleString()}</td>
            <td>{campaign.metrics.clicks.toLocaleString()}</td>
            <td>{campaign.metrics.conversions}</td>
            <td>R$ {campaign.metrics.cpa.toFixed(2)}</td>
            <td>{campaign.metrics.ctr.toFixed(2)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlatformBadge({ platform }: { platform: Platform }) {
  const config = {
    google: { label: 'Google Ads', color: 'blue', emoji: '🔵' },
    meta: { label: 'Meta Ads', color: 'indigo', emoji: '🟣' },
  };
  
  const { label, color, emoji } = config[platform];
  
  return (
    <span className={`badge badge--${color}`}>
      {emoji} {label}
    </span>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = {
    ENABLED: { label: 'Active', color: 'green', emoji: '✅' },
    PAUSED: { label: 'Paused', color: 'orange', emoji: '⏸️' },
    REMOVED: { label: 'Removed', color: 'red', emoji: '❌' },
  };
  
  const { label, color, emoji } = config[status];
  
  return (
    <span className={`badge badge--${color}`}>
      {emoji} {label}
    </span>
  );
}

// ============================================================================
// Usage Example
// ============================================================================

/*
// In your Next.js page:

import { CampaignDashboard } from '@/components/CampaignDashboard';

export default function CampaignsPage() {
  return (
    <main className="container">
      <CampaignDashboard />
    </main>
  );
}

// Or use the hook directly:

function MyComponent() {
  const { campaigns, loading } = useCampaigns({
    platform: 'google',
    status: 'ENABLED',
    minBudget: 100,
  });
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <h1>Active Google Ads Campaigns (Budget ≥ R$100)</h1>
      {campaigns.map(c => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}
*/
