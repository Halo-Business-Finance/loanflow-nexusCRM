-- Install default Lead Scoring Models for loan/finance CRM

-- Get the first admin/super_admin user to assign as creator
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get first admin or super_admin user
    SELECT ur.user_id INTO admin_user_id
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'super_admin') 
    AND ur.is_active = true
    LIMIT 1;
    
    -- If no admin found, get any user
    IF admin_user_id IS NULL THEN
        SELECT ur.user_id INTO admin_user_id
        FROM public.user_roles ur
        WHERE ur.is_active = true
        LIMIT 1;
    END IF;
    
    -- Insert default scoring models
    INSERT INTO public.lead_scoring_models (
        name, description, user_id, behavioral_rules, demographic_rules, score_thresholds, is_active
    ) VALUES 
    (
        'Standard Loan Scoring',
        'General purpose scoring model for all loan types based on financial strength and engagement',
        admin_user_id,
        '[
            {"rule": "website_visits", "weight": 10, "condition": ">=3", "description": "Multiple website visits"},
            {"rule": "form_submissions", "weight": 15, "condition": ">=1", "description": "Submitted application form"},
            {"rule": "phone_contact", "weight": 20, "condition": ">=1", "description": "Phone conversation completed"},
            {"rule": "email_opens", "weight": 5, "condition": ">=2", "description": "Opened marketing emails"},
            {"rule": "document_uploads", "weight": 25, "condition": ">=1", "description": "Uploaded required documents"}
        ]'::jsonb,
        '[
            {"rule": "credit_score", "weight": 30, "condition": ">=650", "description": "Good credit score"},
            {"rule": "annual_revenue", "weight": 25, "condition": ">=50000", "description": "Minimum annual revenue"},
            {"rule": "loan_amount", "weight": 15, "condition": "<=500000", "description": "Reasonable loan amount"},
            {"rule": "business_age", "weight": 10, "condition": ">=1", "description": "Established business"}
        ]'::jsonb,
        '{
            "cold": {"min": 0, "max": 30, "color": "#94a3b8"},
            "warm": {"min": 31, "max": 60, "color": "#fbbf24"},
            "hot": {"min": 61, "max": 85, "color": "#f97316"},
            "qualified": {"min": 86, "max": 100, "color": "#22c55e"}
        }'::jsonb,
        true
    ),
    (
        'High-Value Commercial Loans',
        'Specialized scoring for large commercial loan applications over $500K',
        admin_user_id,
        '[
            {"rule": "consultation_scheduled", "weight": 25, "condition": ">=1", "description": "Scheduled consultation call"},
            {"rule": "financial_docs_provided", "weight": 30, "condition": ">=1", "description": "Provided financial statements"},
            {"rule": "follow_up_responses", "weight": 15, "condition": ">=2", "description": "Responsive to follow-ups"},
            {"rule": "referral_source", "weight": 10, "condition": "=professional", "description": "Professional referral"}
        ]'::jsonb,
        '[
            {"rule": "credit_score", "weight": 35, "condition": ">=700", "description": "Excellent credit score"},
            {"rule": "annual_revenue", "weight": 30, "condition": ">=1000000", "description": "High annual revenue"},
            {"rule": "loan_amount", "weight": 15, "condition": ">=500000", "description": "Large loan requirement"},
            {"rule": "debt_to_income", "weight": 20, "condition": "<=40", "description": "Healthy debt-to-income ratio"}
        ]'::jsonb,
        '{
            "cold": {"min": 0, "max": 40, "color": "#94a3b8"},
            "warm": {"min": 41, "max": 70, "color": "#fbbf24"},
            "hot": {"min": 71, "max": 90, "color": "#f97316"},
            "qualified": {"min": 91, "max": 100, "color": "#22c55e"}
        }'::jsonb,
        true
    ),
    (
        'Small Business Quick Loans',
        'Fast-track scoring for small business loans under $100K with quick approval process',
        admin_user_id,
        '[
            {"rule": "quick_application", "weight": 20, "condition": "completed", "description": "Completed quick application"},
            {"rule": "bank_statements_uploaded", "weight": 25, "condition": ">=1", "description": "Bank statements provided"},
            {"rule": "same_day_response", "weight": 15, "condition": "true", "description": "Responded same day"},
            {"rule": "digital_signature", "weight": 10, "condition": "completed", "description": "Digital signature completed"}
        ]'::jsonb,
        '[
            {"rule": "credit_score", "weight": 25, "condition": ">=600", "description": "Fair credit score"},
            {"rule": "annual_revenue", "weight": 20, "condition": ">=30000", "description": "Minimum revenue requirement"},
            {"rule": "loan_amount", "weight": 20, "condition": "<=100000", "description": "Small loan amount"},
            {"rule": "business_type", "weight": 15, "condition": "=established", "description": "Established business type"},
            {"rule": "time_in_business", "weight": 20, "condition": ">=6", "description": "6+ months in business"}
        ]'::jsonb,
        '{
            "cold": {"min": 0, "max": 25, "color": "#94a3b8"},
            "warm": {"min": 26, "max": 55, "color": "#fbbf24"},
            "hot": {"min": 56, "max": 80, "color": "#f97316"},
            "qualified": {"min": 81, "max": 100, "color": "#22c55e"}
        }'::jsonb,
        true
    ),
    (
        'Personal Loan Scoring',
        'Optimized for personal loans with focus on individual creditworthiness and stability',
        admin_user_id,
        '[
            {"rule": "application_completion", "weight": 15, "condition": "100%", "description": "Complete application"},
            {"rule": "income_verification", "weight": 25, "condition": "verified", "description": "Income verified"},
            {"rule": "employment_verification", "weight": 20, "condition": "verified", "description": "Employment verified"},
            {"rule": "communication_response", "weight": 10, "condition": ">=1", "description": "Responsive to communication"}
        ]'::jsonb,
        '[
            {"rule": "credit_score", "weight": 40, "condition": ">=620", "description": "Good personal credit"},
            {"rule": "annual_income", "weight": 25, "condition": ">=35000", "description": "Stable annual income"},
            {"rule": "employment_duration", "weight": 15, "condition": ">=12", "description": "12+ months employment"},
            {"rule": "debt_to_income", "weight": 20, "condition": "<=45", "description": "Manageable debt ratio"}
        ]'::jsonb,
        '{
            "cold": {"min": 0, "max": 35, "color": "#94a3b8"},
            "warm": {"min": 36, "max": 65, "color": "#fbbf24"},
            "hot": {"min": 66, "max": 85, "color": "#f97316"},
            "qualified": {"min": 86, "max": 100, "color": "#22c55e"}
        }'::jsonb,
        true
    );
    
END $$;