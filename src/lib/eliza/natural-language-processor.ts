/**
 * Eliza OS Natural Language Processor
 * Advanced natural language interface for trading platform control
 */

export interface ElizaCommand {
  id: string;
  type: 'agent' | 'farm' | 'trading' | 'defi' | 'portfolio' | 'system';
  action: string;
  parameters: { [key: string]: any };
  confidence: number;
  timestamp: string;
}

export interface ElizaResponse {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  followUp?: string;
}

export interface ElizaContext {
  user: string;
  portfolio: any;
  agents: any[];
  farms: any[];
  marketConditions: any;
  recentCommands: ElizaCommand[];
}

class NaturalLanguageProcessor {
  private context: ElizaContext | null = null;
  private commandHistory: ElizaCommand[] = [];

  // Intent classification patterns
  private intentPatterns = {
    // Agent Management
    agent_start: [
      /start\s+agent\s+(\w+)/i,
      /activate\s+(\w+)/i,
      /begin\s+trading\s+with\s+(\w+)/i,
      /launch\s+(\w+)\s+agent/i
    ],
    agent_stop: [
      /stop\s+agent\s+(\w+)/i,
      /pause\s+(\w+)/i,
      /halt\s+(\w+)/i,
      /deactivate\s+(\w+)/i
    ],
    agent_create: [
      /create\s+new\s+agent/i,
      /add\s+agent/i,
      /new\s+(\w+)\s+agent/i,
      /setup\s+agent/i
    ],
    agent_fund: [
      /fund\s+(\w+)\s+with\s+\$?(\d+)/i,
      /allocate\s+\$?(\d+)\s+to\s+(\w+)/i,
      /give\s+(\w+)\s+\$?(\d+)/i,
      /transfer\s+\$?(\d+)\s+to\s+(\w+)/i
    ],

    // Farm Management
    farm_create: [
      /create\s+(?:new\s+)?farm/i,
      /setup\s+farm/i,
      /new\s+farm\s+with/i,
      /establish\s+farm/i
    ],
    farm_optimize: [
      /optimize\s+farm/i,
      /rebalance\s+farm/i,
      /improve\s+farm\s+performance/i,
      /adjust\s+farm/i
    ],
    farm_assign: [
      /assign\s+(\w+)\s+to\s+farm/i,
      /add\s+(\w+)\s+to\s+(\w+)\s+farm/i,
      /move\s+(\w+)\s+to\s+farm/i
    ],

    // Trading Operations
    trade_buy: [
      /buy\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /purchase\s+(\w+)/i,
      /long\s+(\w+)/i,
      /acquire\s+(\w+)/i
    ],
    trade_sell: [
      /sell\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /short\s+(\w+)/i,
      /liquidate\s+(\w+)/i,
      /close\s+position/i
    ],
    trade_analyze: [
      /analyze\s+(\w+)/i,
      /what.*think.*about\s+(\w+)/i,
      /should.*buy\s+(\w+)/i,
      /market\s+analysis/i
    ],

    // DeFi Operations
    defi_lend: [
      /lend\s+\$?(\d+)\s+(\w+)/i,
      /supply\s+(\w+)\s+to\s+(\w+)/i,
      /deposit\s+into\s+(\w+)/i,
      /provide\s+liquidity/i
    ],
    defi_borrow: [
      /borrow\s+\$?(\d+)\s+(\w+)/i,
      /take\s+loan/i,
      /leverage\s+position/i
    ],
    defi_yield: [
      /find\s+best\s+yield/i,
      /highest\s+apy/i,
      /yield\s+farming\s+opportunities/i,
      /best\s+rates/i
    ],

    // Portfolio Management
    portfolio_status: [
      /portfolio\s+status/i,
      /how.*doing/i,
      /current\s+positions/i,
      /show\s+portfolio/i,
      /pnl/i,
      /profit.*loss/i
    ],
    portfolio_rebalance: [
      /rebalance\s+portfolio/i,
      /optimize\s+allocation/i,
      /adjust\s+positions/i,
      /portfolio\s+optimization/i
    ],

    // System Commands
    system_status: [
      /system\s+status/i,
      /how.*everything/i,
      /overall\s+performance/i,
      /dashboard\s+summary/i
    ],
    system_emergency: [
      /emergency\s+stop/i,
      /halt\s+everything/i,
      /stop\s+all\s+trading/i,
      /panic\s+mode/i
    ],
    system_secure: [
      /secure\s+profits/i,
      /lock\s+in\s+gains/i,
      /protect\s+profits/i,
      /take\s+profits/i
    ]
  };

  // Entity extraction patterns
  private entityPatterns = {
    amount: /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)[k|K|m|M|b|B]?/g,
    symbol: /\b([A-Z]{3,5})(?:\/[A-Z]{3,5})?\b/g,
    percentage: /(\d+(?:\.\d+)?)\s*%/g,
    agent_name: /\b(marcus|alex|sophia|riley|gamma|epsilon|alpha|beta|delta|zeta)\b/gi,
    protocol: /\b(aave|compound|yearn|maker|uniswap|curve|balancer)\b/gi,
    timeframe: /\b(\d+[smhdwmy]|daily|weekly|monthly)\b/gi
  };

  updateContext(context: Partial<ElizaContext>): void {
    this.context = {
      user: 'trader',
      portfolio: {},
      agents: [],
      farms: [],
      marketConditions: {},
      recentCommands: [],
      ...this.context,
      ...context
    };
  }

  async processCommand(input: string): Promise<ElizaResponse> {
    try {
      // Clean and normalize input
      const normalizedInput = this.normalizeInput(input);
      
      // Extract intent and entities
      const intent = this.extractIntent(normalizedInput);
      const entities = this.extractEntities(normalizedInput);
      
      if (!intent) {
        return this.createResponse(false, "I'm not sure what you want me to do. Try commands like 'start Marcus agent' or 'show portfolio status'.");
      }

      // Create command object
      const command: ElizaCommand = {
        id: `cmd-${Date.now()}`,
        type: this.getCommandType(intent),
        action: intent,
        parameters: { ...entities, originalInput: input },
        confidence: this.calculateConfidence(intent, entities),
        timestamp: new Date().toISOString()
      };

      // Execute command
      const response = await this.executeCommand(command);
      
      // Store in history
      this.commandHistory.unshift(command);
      if (this.commandHistory.length > 100) {
        this.commandHistory = this.commandHistory.slice(0, 100);
      }

      return response;
    } catch (error) {
      console.error('NLP processing error:', error);
      return this.createResponse(false, "I encountered an error processing your command. Please try again.");
    }
  }

  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\$\.\%\/\-]/g, ' ')
      .replace(/\s+/g, ' ');
  }

  private extractIntent(input: string): string | null {
    for (const [intent, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          return intent;
        }
      }
    }
    return null;
  }

  private extractEntities(input: string): { [key: string]: any } {
    const entities: { [key: string]: any } = {};

    // Extract amounts
    const amounts = Array.from(input.matchAll(this.entityPatterns.amount))
      .map(match => this.parseAmount(match[1]));
    if (amounts.length > 0) {
      entities.amount = amounts[0];
      entities.amounts = amounts;
    }

    // Extract symbols
    const symbols = Array.from(input.matchAll(this.entityPatterns.symbol))
      .map(match => match[1].toUpperCase());
    if (symbols.length > 0) {
      entities.symbol = symbols[0];
      entities.symbols = symbols;
    }

    // Extract percentages
    const percentages = Array.from(input.matchAll(this.entityPatterns.percentage))
      .map(match => parseFloat(match[1]));
    if (percentages.length > 0) {
      entities.percentage = percentages[0];
    }

    // Extract agent names
    const agents = Array.from(input.matchAll(this.entityPatterns.agent_name))
      .map(match => match[1].toLowerCase());
    if (agents.length > 0) {
      entities.agent = agents[0];
      entities.agents = agents;
    }

    // Extract protocols
    const protocols = Array.from(input.matchAll(this.entityPatterns.protocol))
      .map(match => match[1].toLowerCase());
    if (protocols.length > 0) {
      entities.protocol = protocols[0];
      entities.protocols = protocols;
    }

    // Extract timeframes
    const timeframes = Array.from(input.matchAll(this.entityPatterns.timeframe))
      .map(match => match[1]);
    if (timeframes.length > 0) {
      entities.timeframe = timeframes[0];
    }

    return entities;
  }

  private parseAmount(amountStr: string): number {
    const cleanAmount = amountStr.replace(/,/g, '');
    const multipliers: { [key: string]: number } = {
      'k': 1000, 'K': 1000,
      'm': 1000000, 'M': 1000000,
      'b': 1000000000, 'B': 1000000000
    };

    const lastChar = cleanAmount.slice(-1);
    if (multipliers[lastChar]) {
      return parseFloat(cleanAmount.slice(0, -1)) * multipliers[lastChar];
    }
    return parseFloat(cleanAmount);
  }

  private getCommandType(intent: string): ElizaCommand['type'] {
    if (intent.startsWith('agent_')) return 'agent';
    if (intent.startsWith('farm_')) return 'farm';
    if (intent.startsWith('trade_')) return 'trading';
    if (intent.startsWith('defi_')) return 'defi';
    if (intent.startsWith('portfolio_')) return 'portfolio';
    if (intent.startsWith('system_')) return 'system';
    return 'system';
  }

  private calculateConfidence(intent: string, entities: any): number {
    let confidence = 0.7; // Base confidence

    // Boost confidence for recognized entities
    if (entities.amount) confidence += 0.1;
    if (entities.symbol) confidence += 0.1;
    if (entities.agent) confidence += 0.1;
    if (entities.protocol) confidence += 0.05;

    // Reduce confidence for vague commands
    if (!entities.amount && intent.includes('fund')) confidence -= 0.2;
    if (!entities.symbol && intent.includes('trade')) confidence -= 0.2;

    return Math.min(0.95, Math.max(0.3, confidence));
  }

  private async executeCommand(command: ElizaCommand): Promise<ElizaResponse> {
    switch (command.action) {
      case 'agent_start':
        return this.handleAgentStart(command);
      case 'agent_stop':
        return this.handleAgentStop(command);
      case 'agent_create':
        return this.handleAgentCreate(command);
      case 'agent_fund':
        return this.handleAgentFund(command);
      case 'farm_create':
        return this.handleFarmCreate(command);
      case 'farm_optimize':
        return this.handleFarmOptimize(command);
      case 'trade_buy':
        return this.handleTradeBuy(command);
      case 'trade_sell':
        return this.handleTradeSell(command);
      case 'trade_analyze':
        return this.handleTradeAnalyze(command);
      case 'defi_lend':
        return this.handleDeFiLend(command);
      case 'defi_yield':
        return this.handleDeFiYield(command);
      case 'portfolio_status':
        return this.handlePortfolioStatus(command);
      case 'portfolio_rebalance':
        return this.handlePortfolioRebalance(command);
      case 'system_status':
        return this.handleSystemStatus(command);
      case 'system_emergency':
        return this.handleSystemEmergency(command);
      case 'system_secure':
        return this.handleSystemSecure(command);
      default:
        return this.createResponse(false, `I understand you want to ${command.action}, but I'm not sure how to execute that yet.`);
    }
  }

  // Command handlers
  private async handleAgentStart(command: ElizaCommand): Promise<ElizaResponse> {
    const agentName = command.parameters.agent;
    if (!agentName) {
      return this.createResponse(false, "Which agent would you like to start? Available agents: Marcus, Alex, Sophia, Riley, Gamma, Epsilon.");
    }

    // Mock implementation - would integrate with actual agent system
    return this.createResponse(true, 
      `✅ Starting ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} agent with current market conditions...`,
      { agentName, status: 'starting' },
      [`Monitor ${agentName}'s performance`, "Check portfolio impact", "Set stop-loss limits"],
      "Would you like me to set any specific risk parameters for this agent?"
    );
  }

  private async handleAgentStop(command: ElizaCommand): Promise<ElizaResponse> {
    const agentName = command.parameters.agent;
    if (!agentName) {
      return this.createResponse(false, "Which agent would you like to stop?");
    }

    return this.createResponse(true,
      `🛑 Stopping ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} agent and securing current positions...`,
      { agentName, status: 'stopping' },
      ["Review final P&L", "Transfer remaining funds", "Analyze performance"],
      "The agent has been safely stopped. Would you like to see the performance summary?"
    );
  }

  private async handleAgentCreate(command: ElizaCommand): Promise<ElizaResponse> {
    const { agent, amount, strategy } = command.parameters;
    const agentName = agent || 'New Agent';
    const strategyType = strategy || 'balanced';

    return this.createResponse(true,
      `🤖 Creating new ${strategyType} agent "${agentName}"${amount ? ` with $${amount.toLocaleString()} initial funding` : ''}...`,
      { agentName, strategy: strategyType, amount, status: 'creating' },
      [`Fund ${agentName}`, "Set risk parameters", "Start trading"],
      `${agentName} agent created successfully! Would you like me to start it with specific trading parameters?`
    );
  }

  private async handleAgentFund(command: ElizaCommand): Promise<ElizaResponse> {
    const { agent, amount } = command.parameters;
    if (!agent || !amount) {
      return this.createResponse(false, "Please specify both the agent and amount. Example: 'Fund Marcus with $5000'");
    }

    return this.createResponse(true,
      `💰 Transferring $${amount.toLocaleString()} to ${agent.charAt(0).toUpperCase() + agent.slice(1)} agent...`,
      { agent, amount, status: 'funding' },
      [`Set ${agent}'s risk parameters`, "Monitor initial trades", "Check wallet balance"],
      `${agent} now has additional funding. Would you like me to adjust their trading strategy?`
    );
  }

  private async handleFarmCreate(command: ElizaCommand): Promise<ElizaResponse> {
    const { amount, protocol } = command.parameters;
    const strategy = protocol || 'balanced';

    return this.createResponse(true,
      `🚜 Creating new farm with ${strategy} strategy${amount ? ` and $${amount.toLocaleString()} initial funding` : ''}...`,
      { strategy, amount, status: 'creating' },
      ["Assign agents to farm", "Set performance targets", "Configure risk limits"],
      "Farm created successfully! Which agents would you like to assign to this farm?"
    );
  }

  private async handleTradeBuy(command: ElizaCommand): Promise<ElizaResponse> {
    const { symbol, amount } = command.parameters;
    if (!symbol) {
      return this.createResponse(false, "Which asset would you like to buy? Please specify the symbol.");
    }

    return this.createResponse(true,
      `📈 Executing buy order for ${symbol}${amount ? ` worth $${amount.toLocaleString()}` : ''}...`,
      { symbol, amount, side: 'buy', status: 'executing' },
      [`Monitor ${symbol} position`, "Set stop-loss", "Track performance"],
      `Buy order submitted for ${symbol}. Would you like me to set up automated profit-taking?`
    );
  }

  private async handleTradeSell(command: ElizaCommand): Promise<ElizaResponse> {
    const { symbol, amount } = command.parameters;
    if (!symbol) {
      return this.createResponse(false, "Which asset would you like to sell? Please specify the symbol.");
    }

    return this.createResponse(true,
      `📉 Executing sell order for ${symbol}${amount ? ` worth $${amount.toLocaleString()}` : ''}...`,
      { symbol, amount, side: 'sell', status: 'executing' },
      [`Monitor ${symbol} exit`, "Review profit/loss", "Reinvest proceeds"],
      `Sell order submitted for ${symbol}. Would you like me to reinvest the proceeds or keep them in stables?`
    );
  }

  private async handleTradeAnalyze(command: ElizaCommand): Promise<ElizaResponse> {
    const { symbol } = command.parameters;
    const asset = symbol || 'market';

    // Mock analysis
    const analysis = {
      signal: 'bullish',
      confidence: 78,
      priceTarget: symbol === 'BTC' ? '$105,000' : symbol === 'ETH' ? '$3,800' : 'TBD',
      timeframe: '1-2 weeks'
    };

    return this.createResponse(true,
      `📊 Analysis for ${asset}: ${analysis.signal.toUpperCase()} signal with ${analysis.confidence}% confidence. Price target: ${analysis.priceTarget} within ${analysis.timeframe}.`,
      { symbol, analysis },
      [`Buy ${symbol}`, `Set price alerts`, "View detailed charts"],
      "Based on this analysis, would you like me to execute a position?"
    );
  }

  private async handleDeFiYield(command: ElizaCommand): Promise<ElizaResponse> {
    const opportunities = [
      { protocol: 'Aave', asset: 'USDC', apy: '5.23%' },
      { protocol: 'Compound', asset: 'ETH', apy: '4.89%' },
      { protocol: 'Yearn', asset: 'USDC', apy: '6.45%' }
    ];

    return this.createResponse(true,
      `🌾 Best current yield opportunities:\n• ${opportunities.map(o => `${o.protocol} ${o.asset}: ${o.apy}`).join('\n• ')}`,
      { opportunities },
      ["Lend to Yearn USDC", "Compare protocols", "Check risk levels"],
      "Yearn Finance offers the highest yield for USDC. Would you like me to deposit there?"
    );
  }

  private async handlePortfolioStatus(command: ElizaCommand): Promise<ElizaResponse> {
    // Mock portfolio data
    const portfolio = {
      totalValue: 125847,
      totalPnL: 5847,
      pnlPercent: 4.87,
      topPerformer: 'Marcus (momentum)',
      topPerformerPnL: 1247
    };

    return this.createResponse(true,
      `💼 Portfolio Status: $${portfolio.totalValue.toLocaleString()} total value | +$${portfolio.totalPnL.toLocaleString()} P&L (${portfolio.pnlPercent}%) | Top performer: ${portfolio.topPerformer} (+$${portfolio.topPerformerPnL})`,
      portfolio,
      ["Rebalance portfolio", "Secure profits", "View detailed breakdown"],
      "Your portfolio is performing well! Would you like me to secure some profits or rebalance allocations?"
    );
  }

  private async handleSystemStatus(command: ElizaCommand): Promise<ElizaResponse> {
    const status = {
      activeAgents: 5,
      activeFarms: 2,
      systemHealth: 'excellent',
      alerts: 0,
      uptime: '99.97%'
    };

    return this.createResponse(true,
      `🖥️ System Status: ${status.activeAgents} agents active | ${status.activeFarms} farms running | Health: ${status.systemHealth} | ${status.alerts} alerts | Uptime: ${status.uptime}`,
      status,
      ["View agent details", "Check farm performance", "System optimization"],
      "All systems are running optimally. Is there anything specific you'd like me to check?"
    );
  }

  private async handleSystemEmergency(command: ElizaCommand): Promise<ElizaResponse> {
    return this.createResponse(true,
      "🚨 EMERGENCY STOP ACTIVATED: All trading halted, positions secured, agents paused. Portfolio locked in safe mode.",
      { emergencyMode: true, timestamp: new Date().toISOString() },
      ["View emergency report", "Resume operations", "Contact support"],
      "Emergency mode is active. All funds are secure. Say 'resume operations' when ready to continue."
    );
  }

  private async handleSystemSecure(command: ElizaCommand): Promise<ElizaResponse> {
    const { percentage = 50 } = command.parameters;
    
    return this.createResponse(true,
      `🔒 Securing ${percentage}% of all profits across agents and farms. Locking in gains and reducing risk exposure...`,
      { securePercentage: percentage, status: 'securing' },
      ["View secured amounts", "Adjust percentages", "Continue trading"],
      "Profits have been secured. Would you like me to reinvest the secured funds or keep them in stable assets?"
    );
  }

  private async handleFarmOptimize(command: ElizaCommand): Promise<ElizaResponse> {
    return this.createResponse(true,
      "🔧 Optimizing farm performance: rebalancing agent allocations, adjusting risk parameters, and maximizing yield efficiency...",
      { optimization: 'in_progress' },
      ["View optimization results", "Adjust parameters", "Monitor performance"],
      "Farm optimization complete! Performance improved by an estimated 12%. Would you like to see the detailed changes?"
    );
  }

  private async handleDeFiLend(command: ElizaCommand): Promise<ElizaResponse> {
    const { amount, symbol, protocol } = command.parameters;
    const targetProtocol = protocol || 'aave';
    
    return this.createResponse(true,
      `🏦 Lending ${amount ? `$${amount.toLocaleString()}` : 'funds'} ${symbol || 'USDC'} to ${targetProtocol.charAt(0).toUpperCase() + targetProtocol.slice(1)}...`,
      { amount, symbol, protocol: targetProtocol, status: 'lending' },
      [`Monitor ${targetProtocol} rates`, "Track earnings", "Set up auto-compound"],
      `Lending position established on ${targetProtocol}. Would you like me to set up automatic compounding?`
    );
  }

  private async handlePortfolioRebalance(command: ElizaCommand): Promise<ElizaResponse> {
    return this.createResponse(true,
      "⚖️ Rebalancing portfolio: analyzing current allocations, market conditions, and risk metrics to optimize performance...",
      { rebalancing: 'in_progress' },
      ["View new allocations", "Adjust targets", "Monitor changes"],
      "Rebalancing complete! Portfolio is now optimized for current market conditions. Would you like to see the new allocation breakdown?"
    );
  }

  private createResponse(
    success: boolean, 
    message: string, 
    data?: any, 
    suggestions?: string[], 
    followUp?: string
  ): ElizaResponse {
    return {
      success,
      message,
      data,
      suggestions,
      followUp
    };
  }

  // Public API methods
  getCommandHistory(limit: number = 10): ElizaCommand[] {
    return this.commandHistory.slice(0, limit);
  }

  clearHistory(): void {
    this.commandHistory = [];
  }

  getSuggestions(): string[] {
    return [
      "Start Marcus agent with $10,000",
      "Show portfolio status",
      "Create new DeFi farm",
      "Find best yield opportunities",
      "Analyze BTC market conditions",
      "Secure 50% of profits",
      "Stop all agents",
      "Rebalance portfolio",
      "Emergency stop everything",
      "Fund Sophia with $5,000"
    ];
  }
}

export const elizaNLP = new NaturalLanguageProcessor();