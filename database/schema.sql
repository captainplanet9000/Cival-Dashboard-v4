-- Cival Trading Platform Database Schema
-- PostgreSQL/Supabase Schema for Advanced Multi-Agent Trading Platform
-- Version: 1.0 - Production Ready

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'trader' CHECK (role IN ('admin', 'trader', 'viewer')),
    settings JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions and activity tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- WALLET & PORTFOLIO MANAGEMENT
-- =============================================

-- User wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT UNIQUE NOT NULL,
    wallet_type TEXT NOT NULL CHECK (wallet_type IN ('metamask', 'coinbase', 'hardware', 'internal')),
    chain_id INTEGER NOT NULL DEFAULT 1,
    is_primary BOOLEAN DEFAULT false,
    balance_cache JSONB DEFAULT '{}',
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio positions
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('crypto', 'stock', 'forex', 'defi', 'nft')),
    quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    average_cost DECIMAL(20, 8) NOT NULL DEFAULT 0,
    current_price DECIMAL(20, 8),
    market_value DECIMAL(20, 2),
    unrealized_pnl DECIMAL(20, 2),
    realized_pnl DECIMAL(20, 2) DEFAULT 0,
    position_type TEXT DEFAULT 'long' CHECK (position_type IN ('long', 'short')),
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Transaction history
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    position_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
    transaction_hash TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'deposit', 'withdrawal', 'transfer', 'swap', 'stake', 'unstake')),
    symbol TEXT NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    price DECIMAL(20, 8),
    total_amount DECIMAL(20, 2) NOT NULL,
    fees DECIMAL(20, 8) DEFAULT 0,
    gas_fee DECIMAL(20, 8) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
    block_number BIGINT,
    exchange TEXT,
    agent_id UUID,
    farm_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- TRADING AGENTS
-- =============================================

-- Trading agents
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('trading', 'arbitrage', 'market_maker', 'yield_farmer', 'scout', 'risk_manager')),
    strategy TEXT NOT NULL,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'error', 'stopped')),
    allocated_balance DECIMAL(20, 2) DEFAULT 0,
    current_balance DECIMAL(20, 2) DEFAULT 0,
    total_pnl DECIMAL(20, 2) DEFAULT 0,
    daily_pnl DECIMAL(20, 2) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    configuration JSONB NOT NULL DEFAULT '{}',
    risk_parameters JSONB NOT NULL DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent trading history
CREATE TABLE IF NOT EXISTS public.agent_trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8),
    exit_price DECIMAL(20, 8),
    pnl DECIMAL(20, 2),
    pnl_percentage DECIMAL(8, 4),
    trade_duration INTERVAL,
    reason TEXT,
    strategy_used TEXT,
    market_conditions JSONB DEFAULT '{}',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Agent performance snapshots (for analytics)
CREATE TABLE IF NOT EXISTS public.agent_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    balance DECIMAL(20, 2) NOT NULL,
    pnl DECIMAL(20, 2) NOT NULL,
    trades_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    sharpe_ratio DECIMAL(8, 4),
    max_drawdown DECIMAL(8, 4),
    volatility DECIMAL(8, 4),
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, snapshot_date)
);

-- =============================================
-- FARMS & COORDINATION
-- =============================================

-- Agent farms for coordination
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    farm_type TEXT NOT NULL CHECK (farm_type IN ('yield', 'arbitrage', 'momentum', 'balanced', 'conservative', 'aggressive')),
    strategy TEXT NOT NULL,
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'paused', 'optimizing')),
    total_allocated DECIMAL(20, 2) DEFAULT 0,
    current_value DECIMAL(20, 2) DEFAULT 0,
    total_pnl DECIMAL(20, 2) DEFAULT 0,
    performance_target DECIMAL(8, 4),
    risk_tolerance TEXT DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    configuration JSONB NOT NULL DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm agent assignments
CREATE TABLE IF NOT EXISTS public.farm_agents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    allocation_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    role TEXT DEFAULT 'trader' CHECK (role IN ('trader', 'scout', 'risk_manager', 'coordinator')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(farm_id, agent_id)
);

-- =============================================
-- DEFI PROTOCOLS & POSITIONS
-- =============================================

-- DeFi protocol integrations
CREATE TABLE IF NOT EXISTS public.defi_protocols (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    protocol_type TEXT NOT NULL CHECK (protocol_type IN ('lending', 'dex', 'yield', 'insurance', 'derivatives')),
    chain_id INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    abi JSONB,
    tvl DECIMAL(20, 2),
    current_apy DECIMAL(8, 4),
    risk_score INTEGER CHECK (risk_score >= 1 AND risk_score <= 10),
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User DeFi positions
CREATE TABLE IF NOT EXISTS public.defi_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    protocol_id UUID REFERENCES public.defi_protocols(id) ON DELETE CASCADE,
    position_type TEXT NOT NULL CHECK (position_type IN ('lending', 'borrowing', 'liquidity', 'staking', 'farming')),
    asset_symbol TEXT NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    entry_price DECIMAL(20, 8),
    current_apy DECIMAL(8, 4),
    earned_amount DECIMAL(20, 8) DEFAULT 0,
    health_factor DECIMAL(8, 4),
    liquidation_price DECIMAL(20, 8),
    transaction_hash TEXT,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- MARKET DATA & ANALYTICS
-- =============================================

-- Market data cache
CREATE TABLE IF NOT EXISTS public.market_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    volume_24h DECIMAL(20, 2),
    change_24h DECIMAL(8, 4),
    market_cap DECIMAL(20, 2),
    high_24h DECIMAL(20, 8),
    low_24h DECIMAL(20, 8),
    data_source TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create index for market data queries
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON public.market_data(symbol, timestamp DESC);

-- Technical indicators cache
CREATE TABLE IF NOT EXISTS public.technical_indicators (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    indicator_type TEXT NOT NULL,
    indicator_data JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(symbol, timeframe, indicator_type, calculated_at)
);

-- =============================================
-- SECURITY & MONITORING
-- =============================================

-- Security events from auto-profit system
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('profit_secured', 'emergency_stop', 'anomaly_detected', 'threshold_breach', 'manual_intervention')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts and notifications
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('info', 'warning', 'error', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    component TEXT,
    action_required BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- TRADING STRATEGIES & BACKTESTS
-- =============================================

-- Trading strategies
CREATE TABLE IF NOT EXISTS public.trading_strategies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    strategy_type TEXT NOT NULL CHECK (strategy_type IN ('momentum', 'mean_reversion', 'arbitrage', 'market_making', 'grid', 'dca')),
    parameters JSONB NOT NULL DEFAULT '{}',
    risk_management JSONB NOT NULL DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategy backtests
CREATE TABLE IF NOT EXISTS public.strategy_backtests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    strategy_id UUID REFERENCES public.trading_strategies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    symbols TEXT[] NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(20, 2) NOT NULL,
    final_value DECIMAL(20, 2),
    total_return DECIMAL(8, 4),
    annualized_return DECIMAL(8, 4),
    max_drawdown DECIMAL(8, 4),
    sharpe_ratio DECIMAL(8, 4),
    win_rate DECIMAL(5, 2),
    total_trades INTEGER,
    results_data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GOALS & AUTOMATION
-- =============================================

-- User trading goals
CREATE TABLE IF NOT EXISTS public.trading_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('profit_target', 'risk_limit', 'allocation', 'diversification', 'yield')),
    target_value DECIMAL(20, 2),
    target_percentage DECIMAL(8, 4),
    current_value DECIMAL(20, 2) DEFAULT 0,
    current_percentage DECIMAL(8, 4) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    deadline DATE,
    achievement_date DATE,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS & REPORTING
-- =============================================

-- Portfolio snapshots for analytics
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value DECIMAL(20, 2) NOT NULL,
    total_pnl DECIMAL(20, 2) NOT NULL,
    positions_count INTEGER DEFAULT 0,
    agents_count INTEGER DEFAULT 0,
    farms_count INTEGER DEFAULT 0,
    risk_score DECIMAL(8, 4),
    diversification_score DECIMAL(8, 4),
    performance_metrics JSONB DEFAULT '{}',
    asset_allocation JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Wallet and portfolio indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.positions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Agent-related indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_trades_agent_id ON public.agent_trades(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_trades_opened_at ON public.agent_trades(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_id ON public.agent_performance(agent_id);

-- Farm-related indexes
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_agents_farm_id ON public.farm_agents(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_agents_agent_id ON public.farm_agents(agent_id);

-- DeFi-related indexes
CREATE INDEX IF NOT EXISTS idx_defi_positions_user_id ON public.defi_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_defi_positions_protocol_id ON public.defi_positions(protocol_id);

-- Security and alerts indexes
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_user_id ON public.system_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_read ON public.system_alerts(read);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own positions" ON public.positions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agents" ON public.agents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own agent trades" ON public.agent_trades
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own farms" ON public.farms
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own defi positions" ON public.defi_positions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own security events" ON public.security_events
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts" ON public.system_alerts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own strategies" ON public.trading_strategies
    FOR ALL USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can view own backtests" ON public.strategy_backtests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON public.trading_goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own snapshots" ON public.portfolio_snapshots
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON public.farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at BEFORE UPDATE ON public.trading_strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON public.trading_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate portfolio metrics
CREATE OR REPLACE FUNCTION calculate_portfolio_metrics(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    total_value DECIMAL(20, 2) := 0;
    total_pnl DECIMAL(20, 2) := 0;
    positions_count INTEGER := 0;
    result JSONB;
BEGIN
    SELECT 
        COALESCE(SUM(market_value), 0),
        COALESCE(SUM(unrealized_pnl + realized_pnl), 0),
        COUNT(*)
    INTO total_value, total_pnl, positions_count
    FROM public.positions
    WHERE user_id = user_uuid AND quantity > 0;

    result := jsonb_build_object(
        'total_value', total_value,
        'total_pnl', total_pnl,
        'positions_count', positions_count,
        'calculated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL DATA & DEFAULTS
-- =============================================

-- Insert default DeFi protocols
INSERT INTO public.defi_protocols (name, protocol_type, chain_id, contract_address, current_apy, risk_score, configuration) VALUES
('Aave', 'lending', 1, '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', 4.23, 3, '{"version": "v3", "governance": "decentralized"}'),
('Compound', 'lending', 1, '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B', 3.89, 3, '{"version": "v3", "governance": "token_holders"}'),
('Uniswap', 'dex', 1, '0x1F98431c8aD98523631AE4a59f267346ea31F984', 0.3, 2, '{"version": "v3", "fee_tiers": [0.01, 0.05, 0.3, 1.0]}'),
('Yearn Finance', 'yield', 1, '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804', 6.45, 4, '{"version": "v2", "auto_compound": true}')
ON CONFLICT (name) DO NOTHING;

-- Create default trading strategies
INSERT INTO public.trading_strategies (name, description, strategy_type, parameters, risk_management, is_public) VALUES
('RSI Mean Reversion', 'Buy when RSI is oversold, sell when overbought', 'mean_reversion', 
 '{"rsi_period": 14, "oversold_threshold": 30, "overbought_threshold": 70}',
 '{"max_position_size": 0.1, "stop_loss_percent": 5, "take_profit_percent": 10}', true),
('Moving Average Crossover', 'Buy when fast MA crosses above slow MA', 'momentum',
 '{"fast_period": 10, "slow_period": 20, "ma_type": "sma"}',
 '{"max_position_size": 0.15, "stop_loss_percent": 3, "take_profit_percent": 8}', true),
('Grid Trading', 'Buy and sell at predetermined price levels', 'grid',
 '{"grid_spacing": 0.01, "number_of_grids": 10, "base_order_size": 100}',
 '{"max_position_size": 0.2, "stop_loss_percent": 10, "take_profit_percent": 5}', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- MAINTENANCE FUNCTIONS
-- =============================================

-- Function to clean old market data (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_market_data()
RETURNS void AS $$
BEGIN
    DELETE FROM public.market_data 
    WHERE timestamp < NOW() - INTERVAL '30 days';
    
    DELETE FROM public.technical_indicators
    WHERE calculated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to create daily portfolio snapshots
CREATE OR REPLACE FUNCTION create_daily_snapshots()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    snapshot_data JSONB;
BEGIN
    FOR user_record IN SELECT id FROM public.users LOOP
        snapshot_data := calculate_portfolio_metrics(user_record.id);
        
        INSERT INTO public.portfolio_snapshots (
            user_id, 
            snapshot_date, 
            total_value, 
            total_pnl,
            performance_metrics
        ) VALUES (
            user_record.id,
            CURRENT_DATE,
            (snapshot_data->>'total_value')::DECIMAL(20,2),
            (snapshot_data->>'total_pnl')::DECIMAL(20,2),
            snapshot_data
        ) ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
            total_value = EXCLUDED.total_value,
            total_pnl = EXCLUDED.total_pnl,
            performance_metrics = EXCLUDED.performance_metrics;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance functions (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-market-data', '0 2 * * *', 'SELECT cleanup_old_market_data();');
-- SELECT cron.schedule('daily-snapshots', '0 1 * * *', 'SELECT create_daily_snapshots();');

-- =============================================
-- SCHEMA COMPLETE
-- =============================================

-- Grant permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create a view for user dashboard summary
CREATE OR REPLACE VIEW public.user_dashboard_summary AS
SELECT 
    u.id as user_id,
    u.display_name,
    COUNT(DISTINCT a.id) as active_agents,
    COUNT(DISTINCT f.id) as active_farms,
    COUNT(DISTINCT p.id) as total_positions,
    COALESCE(SUM(p.market_value), 0) as total_portfolio_value,
    COALESCE(SUM(p.unrealized_pnl + p.realized_pnl), 0) as total_pnl,
    COUNT(DISTINCT CASE WHEN se.severity IN ('high', 'critical') AND NOT se.resolved THEN se.id END) as critical_alerts
FROM public.users u
LEFT JOIN public.agents a ON a.user_id = u.id AND a.status = 'active'
LEFT JOIN public.farms f ON f.user_id = u.id AND f.status = 'active'
LEFT JOIN public.positions p ON p.user_id = u.id AND p.quantity > 0
LEFT JOIN public.security_events se ON se.user_id = u.id AND se.created_at > NOW() - INTERVAL '24 hours'
GROUP BY u.id, u.display_name;

COMMENT ON DATABASE postgres IS 'Cival Trading Platform - Advanced Multi-Agent Autonomous Trading System Database';
COMMENT ON SCHEMA public IS 'Main schema for Cival Trading Platform with comprehensive trading, DeFi, and analytics capabilities';

-- End of schema