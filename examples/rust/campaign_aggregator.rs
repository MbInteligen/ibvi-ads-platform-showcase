//! # Campaign Aggregator Example
//! 
//! This example demonstrates how the Rust Core API aggregates campaigns
//! from multiple advertising platforms (Google Ads + Meta Ads) into a
//! unified response.

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Unified campaign representation across platforms
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Campaign {
    pub id: String,
    pub platform: Platform,
    pub name: String,
    pub status: CampaignStatus,
    pub daily_budget: f64,
    pub currency: String,
    pub metrics: CampaignMetrics,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Google,
    Meta,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CampaignStatus {
    Enabled,
    Paused,
    Removed,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CampaignMetrics {
    pub impressions: u64,
    pub clicks: u64,
    pub conversions: u32,
    pub cost: f64,
    pub ctr: f64,
    pub cpa: f64,
}

/// Application state shared across handlers
#[derive(Clone)]
pub struct AppState {
    pub http_client: reqwest::Client,
    pub gateway_url: String,
}

/// GET /campaigns - Unified campaigns endpoint
/// 
/// Fetches campaigns from both Google Ads and Meta Ads in parallel,
/// normalizes the data, and returns a unified response.
pub async fn get_campaigns(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<Campaign>>, StatusCode> {
    // Parallel requests to gateway for both platforms
    let google_future = fetch_google_campaigns(&state);
    let meta_future = fetch_meta_campaigns(&state);
    
    // Wait for both requests concurrently
    let (google_result, meta_result) = tokio::join!(google_future, meta_future);
    
    // Handle results
    let mut campaigns = Vec::new();
    
    if let Ok(google_campaigns) = google_result {
        campaigns.extend(google_campaigns);
    }
    
    if let Ok(meta_campaigns) = meta_result {
        campaigns.extend(meta_campaigns);
    }
    
    // Sort by daily budget (highest first)
    campaigns.sort_by(|a, b| {
        b.daily_budget
            .partial_cmp(&a.daily_budget)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    
    Ok(Json(campaigns))
}

/// Fetch Google Ads campaigns from gateway
async fn fetch_google_campaigns(
    state: &AppState,
) -> Result<Vec<Campaign>, reqwest::Error> {
    let url = format!("{}/v1/google/campaigns", state.gateway_url);
    
    let response = state.http_client
        .get(&url)
        .header("X-Service-Auth", "internal-token")
        .send()
        .await?;
    
    response.json::<Vec<Campaign>>().await
}

/// Fetch Meta Ads campaigns from gateway
async fn fetch_meta_campaigns(
    state: &AppState,
) -> Result<Vec<Campaign>, reqwest::Error> {
    let url = format!("{}/v1/meta/campaigns", state.gateway_url);
    
    let response = state.http_client
        .get(&url)
        .header("X-Service-Auth", "internal-token")
        .send()
        .await?;
    
    response.json::<Vec<Campaign>>().await
}

/// Example: Calculate total daily budget across all campaigns
pub fn calculate_total_budget(campaigns: &[Campaign]) -> f64 {
    campaigns
        .iter()
        .filter(|c| matches!(c.status, CampaignStatus::Enabled))
        .map(|c| c.daily_budget)
        .sum()
}

/// Example: Group campaigns by platform
pub fn group_by_platform(
    campaigns: Vec<Campaign>,
) -> (Vec<Campaign>, Vec<Campaign>) {
    campaigns.into_iter().partition(|c| matches!(c.platform, Platform::Google))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculate_total_budget() {
        let campaigns = vec![
            Campaign {
                id: "1".to_string(),
                platform: Platform::Google,
                name: "Test 1".to_string(),
                status: CampaignStatus::Enabled,
                daily_budget: 100.0,
                currency: "BRL".to_string(),
                metrics: CampaignMetrics {
                    impressions: 1000,
                    clicks: 50,
                    conversions: 5,
                    cost: 90.0,
                    ctr: 5.0,
                    cpa: 18.0,
                },
            },
            Campaign {
                id: "2".to_string(),
                platform: Platform::Meta,
                name: "Test 2".to_string(),
                status: CampaignStatus::Paused,
                daily_budget: 200.0,
                currency: "BRL".to_string(),
                metrics: CampaignMetrics {
                    impressions: 500,
                    clicks: 25,
                    conversions: 2,
                    cost: 45.0,
                    ctr: 5.0,
                    cpa: 22.5,
                },
            },
        ];
        
        // Only enabled campaigns should be counted
        assert_eq!(calculate_total_budget(&campaigns), 100.0);
    }
    
    #[test]
    fn test_group_by_platform() {
        let campaigns = vec![
            Campaign {
                id: "g1".to_string(),
                platform: Platform::Google,
                name: "Google Campaign".to_string(),
                status: CampaignStatus::Enabled,
                daily_budget: 100.0,
                currency: "BRL".to_string(),
                metrics: Default::default(),
            },
            Campaign {
                id: "m1".to_string(),
                platform: Platform::Meta,
                name: "Meta Campaign".to_string(),
                status: CampaignStatus::Enabled,
                daily_budget: 200.0,
                currency: "BRL".to_string(),
                metrics: Default::default(),
            },
        ];
        
        let (google, meta) = group_by_platform(campaigns);
        assert_eq!(google.len(), 1);
        assert_eq!(meta.len(), 1);
    }
}

// Default implementation for CampaignMetrics (for tests)
impl Default for CampaignMetrics {
    fn default() -> Self {
        Self {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            cost: 0.0,
            ctr: 0.0,
            cpa: 0.0,
        }
    }
}
