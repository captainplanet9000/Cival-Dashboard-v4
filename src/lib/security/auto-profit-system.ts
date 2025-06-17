/**
 * Agent Auto-Profit Security System
 * Advanced security layer for protecting agent profits and detecting anomalies
 */

import { EventEmitter } from 'events';

export interface SecurityConfig {
  maxDailyLoss: number;
  maxPositionSize: number;
  emergencyStopThreshold: number;
  profitSecurityThreshold: number;
  anomalyDetectionEnabled: boolean;
  autoSecureProfits: boolean;
  alertChannels: ('email' | 'sms' | 'discord' | 'telegram')[];
}

export interface SecurityEvent {
  id: string;
  type: 'profit_secured' | 'emergency_stop' | 'anomaly_detected' | 'threshold_breach' | 'manual_intervention';
  severity: 'low' | 'medium' | 'high' | 'critical';
  agentId: string;
  message: string;
  data: any;
  timestamp: string;
  resolved: boolean;
}

export interface ProfitSecurityRule {
  id: string;
  name: string;
  condition: (agentData: any) => boolean;
  action: 'secure_profits' | 'reduce_position' | 'stop_trading' | 'alert_only';
  threshold: number;
  enabled: boolean;
}

export interface AgentSecurityStatus {
  agentId: string;
  status: 'safe' | 'warning' | 'danger' | 'locked';
  profitsSecured: number;
  lastSecurityCheck: string;
  activeRules: string[];
  riskScore: number;
  anomalyScore: number;
}

class AutoProfitSecuritySystem extends EventEmitter {
  private config: SecurityConfig;
  private securityRules: ProfitSecurityRule[] = [];
  private agentSecurityStatus = new Map<string, AgentSecurityStatus>();
  private securityEvents: SecurityEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private emergencyMode = false;

  constructor(config: Partial<SecurityConfig> = {}) {
    super();
    
    this.config = {
      maxDailyLoss: 0.05, // 5% max daily loss
      maxPositionSize: 0.10, // 10% max position size
      emergencyStopThreshold: 0.15, // 15% loss triggers emergency stop
      profitSecurityThreshold: 0.20, // Secure profits at 20% gain
      anomalyDetectionEnabled: true,
      autoSecureProfits: true,
      alertChannels: ['discord'],
      ...config
    };

    this.initializeDefaultRules();
    this.startMonitoring();
  }

  // Initialize default security rules
  private initializeDefaultRules(): void {
    this.securityRules = [
      {
        id: 'auto-profit-secure',
        name: 'Auto Profit Security',
        condition: (agentData) => agentData.pnlPercent >= this.config.profitSecurityThreshold * 100,
        action: 'secure_profits',
        threshold: this.config.profitSecurityThreshold,
        enabled: this.config.autoSecureProfits
      },
      {
        id: 'emergency-stop',
        name: 'Emergency Stop Loss',
        condition: (agentData) => agentData.pnlPercent <= -this.config.emergencyStopThreshold * 100,
        action: 'stop_trading',
        threshold: this.config.emergencyStopThreshold,
        enabled: true
      },
      {
        id: 'daily-loss-limit',
        name: 'Daily Loss Limit',
        condition: (agentData) => agentData.dailyPnlPercent <= -this.config.maxDailyLoss * 100,
        action: 'stop_trading',
        threshold: this.config.maxDailyLoss,
        enabled: true
      },
      {
        id: 'position-size-limit',
        name: 'Position Size Limit',
        condition: (agentData) => agentData.positionSizePercent >= this.config.maxPositionSize * 100,
        action: 'reduce_position',
        threshold: this.config.maxPositionSize,
        enabled: true
      },
      {
        id: 'anomaly-detection',
        name: 'Trading Anomaly Detection',
        condition: (agentData) => this.detectAnomalies(agentData),
        action: 'alert_only',
        threshold: 0.8, // 80% confidence threshold
        enabled: this.config.anomalyDetectionEnabled
      },
      {
        id: 'rapid-profit-security',
        name: 'Rapid Profit Security',
        condition: (agentData) => agentData.pnlPercent >= 10 && agentData.timeToProfit < 3600000, // 10% profit in <1 hour
        action: 'secure_profits',
        threshold: 0.5, // Secure 50% of profits
        enabled: true
      },
      {
        id: 'high-volatility-protection',
        name: 'High Volatility Protection',
        condition: (agentData) => agentData.marketVolatility >= 0.05, // 5% volatility
        action: 'reduce_position',
        threshold: 0.5, // Reduce position by 50%
        enabled: true
      }
    ];
  }

  // Start continuous monitoring
  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(() => {
      this.performSecurityCheck();
    }, 10000); // Check every 10 seconds

    console.log('🛡️ Auto-Profit Security System activated');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛡️ Auto-Profit Security System deactivated');
  }

  // Main security check function
  async performSecurityCheck(): Promise<void> {
    try {
      const agents = await this.getActiveAgents();
      
      for (const agent of agents) {
        await this.checkAgentSecurity(agent);
      }

      // Check for system-wide threats
      await this.checkSystemSecurity(agents);
      
    } catch (error) {
      console.error('Security check failed:', error);
      this.createSecurityEvent({
        type: 'anomaly_detected',
        severity: 'high',
        agentId: 'system',
        message: 'Security check system failure',
        data: { error: error instanceof Error ? error.message : error }
      });
    }
  }

  // Check individual agent security
  private async checkAgentSecurity(agentData: any): Promise<void> {
    const agentId = agentData.id;
    let securityStatus = this.agentSecurityStatus.get(agentId) || {
      agentId,
      status: 'safe',
      profitsSecured: 0,
      lastSecurityCheck: new Date().toISOString(),
      activeRules: [],
      riskScore: 0,
      anomalyScore: 0
    };

    // Calculate risk and anomaly scores
    securityStatus.riskScore = this.calculateRiskScore(agentData);
    securityStatus.anomalyScore = this.calculateAnomalyScore(agentData);
    securityStatus.lastSecurityCheck = new Date().toISOString();

    // Check each security rule
    const triggeredRules: string[] = [];
    
    for (const rule of this.securityRules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(agentData)) {
          triggeredRules.push(rule.id);
          await this.executeSecurityAction(rule, agentData);
        }
      } catch (error) {
        console.error(`Security rule ${rule.id} failed:`, error);
      }
    }

    securityStatus.activeRules = triggeredRules;
    securityStatus.status = this.determineSecurityStatus(securityStatus);
    
    this.agentSecurityStatus.set(agentId, securityStatus);
    this.emit('agent_security_update', securityStatus);
  }

  // Execute security actions
  private async executeSecurityAction(rule: ProfitSecurityRule, agentData: any): Promise<void> {
    const agentId = agentData.id;

    switch (rule.action) {
      case 'secure_profits':
        await this.secureProfits(agentId, rule.threshold);
        this.createSecurityEvent({
          type: 'profit_secured',
          severity: 'medium',
          agentId,
          message: `Profits secured by rule: ${rule.name}`,
          data: { rule: rule.id, threshold: rule.threshold, agentPnL: agentData.pnl }
        });
        break;

      case 'reduce_position':
        await this.reducePosition(agentId, rule.threshold);
        this.createSecurityEvent({
          type: 'threshold_breach',
          severity: 'medium',
          agentId,
          message: `Position reduced by rule: ${rule.name}`,
          data: { rule: rule.id, reduction: rule.threshold }
        });
        break;

      case 'stop_trading':
        await this.stopAgentTrading(agentId);
        this.createSecurityEvent({
          type: 'emergency_stop',
          severity: 'high',
          agentId,
          message: `Emergency stop triggered by rule: ${rule.name}`,
          data: { rule: rule.id, agentData }
        });
        break;

      case 'alert_only':
        this.createSecurityEvent({
          type: 'anomaly_detected',
          severity: 'low',
          agentId,
          message: `Alert from rule: ${rule.name}`,
          data: { rule: rule.id, agentData }
        });
        break;
    }
  }

  // Security actions implementation
  async secureProfits(agentId: string, percentage: number = 0.5): Promise<void> {
    try {
      // Implementation would connect to actual trading system
      console.log(`🔒 Securing ${percentage * 100}% of profits for agent ${agentId}`);
      
      const securityStatus = this.agentSecurityStatus.get(agentId);
      if (securityStatus) {
        securityStatus.profitsSecured += percentage;
        this.agentSecurityStatus.set(agentId, securityStatus);
      }

      this.emit('profits_secured', { agentId, percentage });
    } catch (error) {
      console.error(`Failed to secure profits for ${agentId}:`, error);
    }
  }

  async reducePosition(agentId: string, percentage: number): Promise<void> {
    try {
      console.log(`📉 Reducing position by ${percentage * 100}% for agent ${agentId}`);
      this.emit('position_reduced', { agentId, percentage });
    } catch (error) {
      console.error(`Failed to reduce position for ${agentId}:`, error);
    }
  }

  async stopAgentTrading(agentId: string): Promise<void> {
    try {
      console.log(`🛑 Emergency stop activated for agent ${agentId}`);
      this.emit('agent_stopped', { agentId });
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error);
    }
  }

  // Anomaly detection
  private detectAnomalies(agentData: any): boolean {
    const anomalyScore = this.calculateAnomalyScore(agentData);
    return anomalyScore > 0.8; // 80% confidence threshold
  }

  private calculateAnomalyScore(agentData: any): number {
    let score = 0;
    let factors = 0;

    // Check for unusual trading patterns
    if (agentData.trades24h > agentData.avgTrades * 3) {
      score += 0.3; // Excessive trading
      factors++;
    }

    if (Math.abs(agentData.pnlPercent) > agentData.avgPnlPercent * 5) {
      score += 0.4; // Unusual PnL
      factors++;
    }

    if (agentData.lastTradeSize > agentData.avgTradeSize * 10) {
      score += 0.5; // Unusually large trade
      factors++;
    }

    if (agentData.errorRate > 0.1) {
      score += 0.2; // High error rate
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  private calculateRiskScore(agentData: any): number {
    let riskScore = 0;

    // PnL risk factor
    if (agentData.pnlPercent < -10) riskScore += 0.4;
    else if (agentData.pnlPercent < -5) riskScore += 0.2;

    // Volatility risk factor
    if (agentData.volatility > 0.05) riskScore += 0.3;
    else if (agentData.volatility > 0.03) riskScore += 0.1;

    // Position size risk factor
    if (agentData.positionSizePercent > 15) riskScore += 0.3;
    else if (agentData.positionSizePercent > 10) riskScore += 0.1;

    return Math.min(riskScore, 1.0);
  }

  private determineSecurityStatus(securityStatus: AgentSecurityStatus): 'safe' | 'warning' | 'danger' | 'locked' {
    if (securityStatus.activeRules.includes('emergency-stop')) return 'locked';
    if (securityStatus.riskScore > 0.7) return 'danger';
    if (securityStatus.riskScore > 0.4 || securityStatus.anomalyScore > 0.6) return 'warning';
    return 'safe';
  }

  // Event management
  private createSecurityEvent(eventData: Partial<SecurityEvent>): void {
    const event: SecurityEvent = {
      id: `security-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'anomaly_detected',
      severity: 'low',
      agentId: 'unknown',
      message: 'Security event',
      data: {},
      timestamp: new Date().toISOString(),
      resolved: false,
      ...eventData
    };

    this.securityEvents.unshift(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(0, 1000);
    }

    this.emit('security_event', event);
    
    // Send alerts for high severity events
    if (event.severity === 'high' || event.severity === 'critical') {
      this.sendAlert(event);
    }
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    try {
      // Implementation would integrate with actual alert systems
      console.log(`🚨 SECURITY ALERT [${event.severity.toUpperCase()}]: ${event.message}`);
      
      for (const channel of this.config.alertChannels) {
        // Send to configured channels (Discord, Telegram, email, etc.)
        console.log(`📢 Alert sent to ${channel}`);
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // System-wide security checks
  private async checkSystemSecurity(agents: any[]): Promise<void> {
    const totalPnL = agents.reduce((sum, agent) => sum + agent.pnl, 0);
    const totalValue = agents.reduce((sum, agent) => sum + agent.balance, 0);
    const systemPnLPercent = (totalPnL / totalValue) * 100;

    // System-wide emergency stop
    if (systemPnLPercent <= -this.config.emergencyStopThreshold * 100) {
      this.activateEmergencyMode();
    }

    // System recovery
    if (this.emergencyMode && systemPnLPercent > -this.config.maxDailyLoss * 100) {
      this.deactivateEmergencyMode();
    }
  }

  private activateEmergencyMode(): void {
    if (this.emergencyMode) return;

    this.emergencyMode = true;
    console.log('🚨 SYSTEM-WIDE EMERGENCY MODE ACTIVATED');
    
    this.createSecurityEvent({
      type: 'emergency_stop',
      severity: 'critical',
      agentId: 'system',
      message: 'System-wide emergency mode activated',
      data: { mode: 'emergency' }
    });

    this.emit('emergency_mode_activated');
  }

  private deactivateEmergencyMode(): void {
    if (!this.emergencyMode) return;

    this.emergencyMode = false;
    console.log('✅ Emergency mode deactivated - system recovery detected');
    
    this.createSecurityEvent({
      type: 'manual_intervention',
      severity: 'medium',
      agentId: 'system',
      message: 'Emergency mode deactivated - system recovered',
      data: { mode: 'normal' }
    });

    this.emit('emergency_mode_deactivated');
  }

  // Mock implementation for getting agents (replace with real integration)
  private async getActiveAgents(): Promise<any[]> {
    // This would connect to your actual agent system
    return [
      {
        id: 'agent-1',
        pnl: 425,
        pnlPercent: 5.3,
        dailyPnlPercent: 2.1,
        balance: 8500,
        trades24h: 47,
        avgTrades: 35,
        avgPnlPercent: 3.2,
        lastTradeSize: 1000,
        avgTradeSize: 500,
        errorRate: 0.02,
        volatility: 0.025,
        positionSizePercent: 12,
        timeToProfit: 7200000, // 2 hours
        marketVolatility: 0.03
      }
    ];
  }

  // Public API methods
  getSecurityStatus(agentId?: string): AgentSecurityStatus[] | AgentSecurityStatus | null {
    if (agentId) {
      return this.agentSecurityStatus.get(agentId) || null;
    }
    return Array.from(this.agentSecurityStatus.values());
  }

  getSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(0, limit);
  }

  addCustomRule(rule: ProfitSecurityRule): void {
    this.securityRules.push(rule);
    console.log(`Added custom security rule: ${rule.name}`);
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Security configuration updated');
  }

  async manualSecurityCheck(agentId?: string): Promise<void> {
    if (agentId) {
      const agents = await this.getActiveAgents();
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        await this.checkAgentSecurity(agent);
      }
    } else {
      await this.performSecurityCheck();
    }
  }

  resolveSecurityEvent(eventId: string): void {
    const event = this.securityEvents.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      this.emit('security_event_resolved', event);
    }
  }
}

export const autoProfitSecuritySystem = new AutoProfitSecuritySystem();
export { AutoProfitSecuritySystem };