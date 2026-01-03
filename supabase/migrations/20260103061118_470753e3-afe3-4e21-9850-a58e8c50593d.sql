-- Insert sample organizations with varied plans and statuses
INSERT INTO public.organizations (id, name, slug, status, plan, max_users, max_storage_gb, billing_email, features, trial_ends_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TechCorp Solutions', 'techcorp', 'active', 'enterprise', 200, 100, 'billing@techcorp.io', '{"sso": true, "api": true, "whiteLabel": true, "biasDetection": true, "voiceRecording": true}', NULL),
  ('22222222-2222-2222-2222-222222222222', 'StartupXYZ', 'startupxyz', 'trial', 'starter', 10, 5, 'hello@startupxyz.com', '{"sso": false, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', now() + interval '10 days'),
  ('33333333-3333-3333-3333-333333333333', 'Global Industries', 'global-industries', 'active', 'professional', 50, 25, 'accounts@globalind.com', '{"sso": true, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL),
  ('44444444-4444-4444-4444-444444444444', 'Innovate Labs', 'innovate-labs', 'active', 'professional', 50, 25, 'finance@innovatelabs.io', '{"sso": true, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL),
  ('55555555-5555-5555-5555-555555555555', 'SmallBiz Co', 'smallbiz', 'active', 'starter', 10, 5, 'owner@smallbiz.co', '{"sso": false, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL),
  ('66666666-6666-6666-6666-666666666666', 'Enterprise Plus', 'enterprise-plus', 'active', 'enterprise', 500, 200, 'enterprise@entplus.com', '{"sso": true, "api": true, "whiteLabel": true, "biasDetection": true, "voiceRecording": true}', NULL),
  ('77777777-7777-7777-7777-777777777777', 'Growth Startup', 'growth-startup', 'suspended', 'professional', 50, 25, 'billing@growthstartup.io', '{"sso": true, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL),
  ('88888888-8888-8888-8888-888888888888', 'Local Services', 'local-services', 'cancelled', 'starter', 10, 5, 'admin@localservices.net', '{"sso": false, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL),
  ('99999999-9999-9999-9999-999999999999', 'MegaCorp Inc', 'megacorp', 'active', 'enterprise', 1000, 500, 'accounts@megacorp.com', '{"sso": true, "api": true, "whiteLabel": true, "biasDetection": true, "voiceRecording": true}', NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Digital Agency', 'digital-agency', 'active', 'professional', 50, 25, 'hello@digitalagency.co', '{"sso": true, "api": false, "whiteLabel": false, "biasDetection": true, "voiceRecording": true}', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert organization settings for each org
INSERT INTO public.organization_settings (organization_id, company_name, platform_name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TechCorp Solutions', 'TechCorp Feedback'),
  ('22222222-2222-2222-2222-222222222222', 'StartupXYZ', 'EvalifyAI'),
  ('33333333-3333-3333-3333-333333333333', 'Global Industries', 'EvalifyAI'),
  ('44444444-4444-4444-4444-444444444444', 'Innovate Labs', 'EvalifyAI'),
  ('55555555-5555-5555-5555-555555555555', 'SmallBiz Co', 'EvalifyAI'),
  ('66666666-6666-6666-6666-666666666666', 'Enterprise Plus', 'EntPlus People'),
  ('77777777-7777-7777-7777-777777777777', 'Growth Startup', 'EvalifyAI'),
  ('88888888-8888-8888-8888-888888888888', 'Local Services', 'EvalifyAI'),
  ('99999999-9999-9999-9999-999999999999', 'MegaCorp Inc', 'MegaCorp HR'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Digital Agency', 'EvalifyAI')
ON CONFLICT (organization_id) DO NOTHING;

-- Insert sample admin audit logs
INSERT INTO public.admin_audit_logs (action, target_type, target_id, details, created_at)
VALUES 
  ('organization_created', 'organization', '11111111-1111-1111-1111-111111111111', '{"name": "TechCorp Solutions", "plan": "enterprise"}', now() - interval '30 days'),
  ('plan_upgraded', 'organization', '11111111-1111-1111-1111-111111111111', '{"from": "professional", "to": "enterprise", "mrr_change": 2500}', now() - interval '25 days'),
  ('organization_created', 'organization', '22222222-2222-2222-2222-222222222222', '{"name": "StartupXYZ", "plan": "starter"}', now() - interval '5 days'),
  ('organization_created', 'organization', '33333333-3333-3333-3333-333333333333', '{"name": "Global Industries", "plan": "professional"}', now() - interval '60 days'),
  ('settings_updated', 'organization', '33333333-3333-3333-3333-333333333333', '{"setting": "sso_enabled", "value": true}', now() - interval '45 days'),
  ('organization_created', 'organization', '44444444-4444-4444-4444-444444444444', '{"name": "Innovate Labs", "plan": "professional"}', now() - interval '90 days'),
  ('organization_created', 'organization', '55555555-5555-5555-5555-555555555555', '{"name": "SmallBiz Co", "plan": "starter"}', now() - interval '120 days'),
  ('organization_created', 'organization', '66666666-6666-6666-6666-666666666666', '{"name": "Enterprise Plus", "plan": "enterprise"}', now() - interval '180 days'),
  ('organization_suspended', 'organization', '77777777-7777-7777-7777-777777777777', '{"reason": "payment_failed", "attempts": 3}', now() - interval '2 days'),
  ('organization_cancelled', 'organization', '88888888-8888-8888-8888-888888888888', '{"reason": "customer_request", "feedback": "Business closed"}', now() - interval '15 days'),
  ('organization_created', 'organization', '99999999-9999-9999-9999-999999999999', '{"name": "MegaCorp Inc", "plan": "enterprise"}', now() - interval '365 days'),
  ('plan_upgraded', 'organization', '99999999-9999-9999-9999-999999999999', '{"from": "professional", "to": "enterprise", "mrr_change": 4500}', now() - interval '300 days'),
  ('organization_created', 'organization', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"name": "Digital Agency", "plan": "professional"}', now() - interval '45 days'),
  ('user_impersonated', 'user', null, '{"organization": "TechCorp Solutions", "reason": "Support ticket #1234"}', now() - interval '3 days'),
  ('feature_flag_updated', 'feature_flag', null, '{"flag": "new_analytics_dashboard", "enabled": true}', now() - interval '7 days');

-- Insert sample platform alerts
INSERT INTO public.platform_alerts (alert_type, severity, title, message, organization_id, metadata, is_resolved, created_at)
VALUES 
  ('payment_failed', 'error', 'Payment Failed - Growth Startup', 'Invoice INV-2024-0892 payment failed after 3 attempts. Card ending in 4242 was declined.', '77777777-7777-7777-7777-777777777777', '{"invoice_id": "INV-2024-0892", "amount": 499, "currency": "USD", "attempts": 3}', false, now() - interval '2 days'),
  ('usage_limit', 'warning', 'Approaching User Limit - TechCorp', 'Organization has used 185 of 200 user seats (92.5%). Consider upgrading or removing inactive users.', '11111111-1111-1111-1111-111111111111', '{"current_users": 185, "max_users": 200, "percentage": 92.5}', false, now() - interval '1 day'),
  ('storage_limit', 'warning', 'Storage Limit Warning - MegaCorp', 'Organization is using 450GB of 500GB storage (90%). Audio recordings may fail if limit is reached.', '99999999-9999-9999-9999-999999999999', '{"used_gb": 450, "max_gb": 500, "percentage": 90}', false, now() - interval '4 hours'),
  ('trial_expiring', 'info', 'Trial Expiring Soon - StartupXYZ', 'Trial period ends in 10 days. No payment method on file.', '22222222-2222-2222-2222-222222222222', '{"days_remaining": 10, "has_payment_method": false}', false, now() - interval '1 day'),
  ('sso_config_error', 'error', 'SSO Configuration Error - Global Industries', 'SAML certificate expired. Users cannot authenticate via SSO until certificate is renewed.', '33333333-3333-3333-3333-333333333333', '{"provider": "okta", "error": "certificate_expired", "expired_at": "2024-01-01"}', true, now() - interval '10 days'),
  ('api_rate_limit', 'warning', 'High API Usage - Enterprise Plus', 'Organization exceeded 80% of monthly API rate limit. 48,000 of 60,000 requests used.', '66666666-6666-6666-6666-666666666666', '{"used": 48000, "limit": 60000, "percentage": 80}', true, now() - interval '5 days'),
  ('system_health', 'info', 'Scheduled Maintenance Complete', 'Database maintenance completed successfully. All services restored.', null, '{"duration_minutes": 15, "affected_services": ["database", "storage"]}', true, now() - interval '7 days');

-- Insert sample employees directory for each organization
INSERT INTO public.employees_directory (organization_id, email, full_name, team, org_unit)
SELECT 
  org.id,
  CONCAT('user', generate_series, '@', org.slug, '.com'),
  CONCAT('Employee ', generate_series),
  CASE (generate_series % 4)
    WHEN 0 THEN 'Engineering'
    WHEN 1 THEN 'Sales'
    WHEN 2 THEN 'Marketing'
    ELSE 'Operations'
  END,
  CASE (generate_series % 3)
    WHEN 0 THEN 'North America'
    WHEN 1 THEN 'Europe'
    ELSE 'Asia Pacific'
  END
FROM public.organizations org
CROSS JOIN generate_series(1, 
  CASE 
    WHEN org.plan = 'enterprise' THEN 50
    WHEN org.plan = 'professional' THEN 20
    ELSE 5
  END
)
WHERE org.id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);