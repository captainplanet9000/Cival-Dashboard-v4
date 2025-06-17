-- Cival Trading Platform Database Setup Script
-- Run this after creating your Supabase project

-- =============================================
-- STEP 1: Create the main schema
-- =============================================
\i schema.sql

-- =============================================
-- STEP 2: Insert initial configuration data
-- =============================================

-- Create default user (replace with your email)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Get the user ID for further setup
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1;
    
    -- Create user profile
    INSERT INTO public.users (id, email, display_name, role)
    VALUES (user_uuid, 'your-email@example.com', 'Admin User', 'admin')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create default wallet
    INSERT INTO public.wallets (user_id, name, address, wallet_type, is_primary)
    VALUES (user_uuid, 'Main Wallet', '0x742d35cc4bf78d7362c6b07a67dc15c3c1b47a99', 'internal', true)
    ON CONFLICT DO NOTHING;
    
    -- Create sample agents
    INSERT INTO public.agents (user_id, name, agent_type, strategy, status, configuration, risk_parameters) VALUES
    (user_uuid, 'Marcus - Momentum', 'trading', 'momentum', 'active', 
     '{"symbols": ["BTC/USD", "ETH/USD"], "timeframe": "1h", "lookback": 24}',
     '{"max_risk": 5, "stop_loss": -2, "take_profit": 3}'),
    (user_uuid, 'Alex - Arbitrage', 'arbitrage', 'cross_exchange', 'active',
     '{"exchanges": ["binance", "coinbase"], "min_spread": 0.5}',
     '{"max_risk": 3, "stop_loss": -1.5, "take_profit": 2}'),
    (user_uuid, 'Sophia - Mean Reversion', 'trading', 'mean_reversion', 'paused',
     '{"symbols": ["ETH/USD"], "rsi_period": 14, "oversold": 30, "overbought": 70}',
     '{"max_risk": 4, "stop_loss": -2.5, "take_profit": 3.5}')
    ON CONFLICT DO NOTHING;
    
    -- Create sample farm
    INSERT INTO public.farms (user_id, name, description, farm_type, strategy, status, configuration) VALUES
    (user_uuid, 'DeFi Yield Farm', 'Conservative yield farming across multiple protocols', 'yield', 'diversified_yield', 'active',
     '{"protocols": ["aave", "compound", "yearn"], "risk_level": "low", "auto_compound": true}')
    ON CONFLICT DO NOTHING;
    
    -- Create sample trading goals
    INSERT INTO public.trading_goals (user_id, title, description, goal_type, target_value, target_percentage) VALUES
    (user_uuid, 'Monthly Profit Target', 'Achieve 15% monthly returns', 'profit_target', 15000, 15.0),
    (user_uuid, 'Risk Management', 'Keep daily losses under 2%', 'risk_limit', 2000, 2.0),
    (user_uuid, 'Portfolio Diversification', 'Maintain balanced allocation', 'diversification', NULL, 80.0)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Initial data setup completed for user: %', user_uuid;
END $$;

-- =============================================
-- STEP 3: Create sample market data
-- =============================================

-- Insert sample market data for development
INSERT INTO public.market_data (symbol, price, volume_24h, change_24h, market_cap, high_24h, low_24h, data_source) VALUES
('BTC/USD', 97500.00, 25000000000, 2.34, 1900000000000, 98500.00, 96200.00, 'coinbase'),
('ETH/USD', 3240.50, 15000000000, 1.87, 390000000000, 3280.00, 3180.00, 'coinbase'),
('USDC/USD', 1.0001, 8000000000, 0.01, 32000000000, 1.0005, 0.9998, 'coinbase'),
('SOL/USD', 185.20, 2500000000, 4.12, 85000000000, 192.00, 178.50, 'binance'),
('AVAX/USD', 42.80, 800000000, -1.23, 16000000000, 44.20, 41.90, 'binance')
ON CONFLICT DO NOTHING;

-- Insert sample technical indicators
INSERT INTO public.technical_indicators (symbol, timeframe, indicator_type, indicator_data) VALUES
('BTC/USD', '1h', 'rsi', '{"value": 65.4, "signal": "neutral", "timestamp": "2024-12-15T10:00:00Z"}'),
('BTC/USD', '1h', 'macd', '{"macd": 234.5, "signal": 198.2, "histogram": 36.3, "trend": "bullish"}'),
('ETH/USD', '1h', 'rsi', '{"value": 58.2, "signal": "neutral", "timestamp": "2024-12-15T10:00:00Z"}'),
('ETH/USD', '4h', 'bollinger_bands', '{"upper": 3320, "middle": 3240, "lower": 3160, "position": "middle"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 4: Setup development environment
-- =============================================

-- Create development-friendly policies (more permissive)
-- Note: In production, these should be more restrictive

-- Allow read access to market data for all authenticated users
CREATE POLICY "Allow market data read" ON public.market_data
    FOR SELECT USING (true);

CREATE POLICY "Allow technical indicators read" ON public.technical_indicators
    FOR SELECT USING (true);

CREATE POLICY "Allow protocol data read" ON public.defi_protocols
    FOR SELECT USING (true);

-- =============================================
-- STEP 5: Create sample transactions and performance data
-- =============================================

DO $$
DECLARE
    user_uuid UUID;
    agent_uuid UUID;
    wallet_uuid UUID;
BEGIN
    -- Get user and related IDs
    SELECT id INTO user_uuid FROM public.users WHERE email = 'your-email@example.com' LIMIT 1;
    SELECT id INTO agent_uuid FROM public.agents WHERE user_id = user_uuid LIMIT 1;
    SELECT id INTO wallet_uuid FROM public.wallets WHERE user_id = user_uuid LIMIT 1;
    
    -- Create sample transactions
    INSERT INTO public.transactions (user_id, wallet_id, transaction_type, symbol, quantity, price, total_amount, status, agent_id) VALUES
    (user_uuid, wallet_uuid, 'buy', 'BTC/USD', 0.1, 95000.00, 9500.00, 'confirmed', agent_uuid),
    (user_uuid, wallet_uuid, 'buy', 'ETH/USD', 2.5, 3100.00, 7750.00, 'confirmed', agent_uuid),
    (user_uuid, wallet_uuid, 'sell', 'BTC/USD', 0.05, 97500.00, 4875.00, 'confirmed', agent_uuid),
    (user_uuid, wallet_uuid, 'deposit', 'USDC', 50000, 1.00, 50000.00, 'confirmed', NULL)
    ON CONFLICT DO NOTHING;
    
    -- Create portfolio positions based on transactions
    INSERT INTO public.positions (user_id, wallet_id, symbol, asset_type, quantity, average_cost, current_price, market_value, unrealized_pnl) VALUES
    (user_uuid, wallet_uuid, 'BTC/USD', 'crypto', 0.05, 95000.00, 97500.00, 4875.00, 125.00),
    (user_uuid, wallet_uuid, 'ETH/USD', 'crypto', 2.5, 3100.00, 3240.50, 8101.25, 351.25),
    (user_uuid, wallet_uuid, 'USDC/USD', 'crypto', 37625.00, 1.00, 1.0001, 37628.76, 3.76)
    ON CONFLICT DO NOTHING;
    
    -- Create agent performance data
    INSERT INTO public.agent_performance (agent_id, snapshot_date, balance, pnl, trades_count, win_rate, sharpe_ratio) VALUES
    (agent_uuid, CURRENT_DATE - INTERVAL '1 day', 15000.00, 500.00, 12, 75.0, 1.8),
    (agent_uuid, CURRENT_DATE, 15500.00, 1000.00, 15, 73.3, 1.9)
    ON CONFLICT DO NOTHING;
    
    -- Create portfolio snapshot
    INSERT INTO public.portfolio_snapshots (user_id, snapshot_date, total_value, total_pnl, positions_count, agents_count) VALUES
    (user_uuid, CURRENT_DATE, 50605.01, 480.01, 3, 3)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample trading data created for user: %', user_uuid;
END $$;

-- =============================================
-- STEP 6: Security and monitoring setup
-- =============================================

-- Create sample security events
INSERT INTO public.security_events (user_id, event_type, severity, message, event_data) 
SELECT 
    u.id,
    'profit_secured',
    'medium',
    'Auto-profit security system secured 20% of gains',
    '{"amount": 1000, "percentage": 20, "trigger": "profit_threshold"}'
FROM public.users u
WHERE u.email = 'your-email@example.com'
ON CONFLICT DO NOTHING;

-- Create sample system alerts
INSERT INTO public.system_alerts (user_id, alert_type, title, message, component)
SELECT 
    u.id,
    'success',
    'System Initialized',
    'Cival Trading Platform has been successfully set up and is ready for trading operations.',
    'system'
FROM public.users u
WHERE u.email = 'your-email@example.com'
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 7: Final verification
-- =============================================

-- Verify the setup
DO $$
DECLARE
    user_count INTEGER;
    agent_count INTEGER;
    position_count INTEGER;
    transaction_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO agent_count FROM public.agents;
    SELECT COUNT(*) INTO position_count FROM public.positions;
    SELECT COUNT(*) INTO transaction_count FROM public.transactions;
    
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Users: %', user_count;
    RAISE NOTICE '- Agents: %', agent_count;
    RAISE NOTICE '- Positions: %', position_count;
    RAISE NOTICE '- Transactions: %', transaction_count;
    
    IF user_count > 0 AND agent_count > 0 THEN
        RAISE NOTICE '✅ Database setup completed successfully!';
    ELSE
        RAISE WARNING '❌ Setup incomplete - check for errors above';
    END IF;
END $$;

-- =============================================
-- STEP 8: Create helpful views for development
-- =============================================

-- View for quick portfolio overview
CREATE OR REPLACE VIEW public.portfolio_overview AS
SELECT 
    u.display_name as user_name,
    COUNT(DISTINCT p.id) as total_positions,
    COALESCE(SUM(p.market_value), 0) as total_value,
    COALESCE(SUM(p.unrealized_pnl), 0) as unrealized_pnl,
    COUNT(DISTINCT a.id) as active_agents,
    COUNT(DISTINCT f.id) as active_farms
FROM public.users u
LEFT JOIN public.positions p ON p.user_id = u.id AND p.quantity > 0
LEFT JOIN public.agents a ON a.user_id = u.id AND a.status = 'active'
LEFT JOIN public.farms f ON f.user_id = u.id AND f.status = 'active'
GROUP BY u.id, u.display_name;

-- View for agent performance summary
CREATE OR REPLACE VIEW public.agent_summary AS
SELECT 
    a.name,
    a.agent_type,
    a.strategy,
    a.status,
    a.current_balance,
    a.total_pnl,
    a.win_rate,
    COUNT(at.id) as total_trades,
    AVG(at.pnl) as avg_trade_pnl
FROM public.agents a
LEFT JOIN public.agent_trades at ON at.agent_id = a.id
GROUP BY a.id, a.name, a.agent_type, a.strategy, a.status, a.current_balance, a.total_pnl, a.win_rate;

COMMENT ON VIEW public.portfolio_overview IS 'Quick overview of user portfolios';
COMMENT ON VIEW public.agent_summary IS 'Summary of agent performance metrics';

RAISE NOTICE '';
RAISE NOTICE '🎉 Cival Trading Platform Database Setup Complete!';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Update your .env.local file with the Supabase credentials';
RAISE NOTICE '2. Replace "your-email@example.com" with your actual email';
RAISE NOTICE '3. Set up Redis for caching and real-time features';
RAISE NOTICE '4. Configure your trading API keys';
RAISE NOTICE '5. Start the development server: npm run dev';
RAISE NOTICE '';
RAISE NOTICE 'For production deployment:';
RAISE NOTICE '1. Review and tighten RLS policies';
RAISE NOTICE '2. Set up proper monitoring and alerting';
RAISE NOTICE '3. Configure backup strategies';
RAISE NOTICE '4. Enable audit logging';
RAISE NOTICE '';