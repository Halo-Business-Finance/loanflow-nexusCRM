-- Assign admin role to Nuri so they can see all data
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('daf63630-64e4-4036-ad5d-d617c1ea618a', 'admin', true)
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

-- Let's also create some test data for better testing
-- Create a lead for Nuri to test cross-user visibility
INSERT INTO public.leads (
    user_id, 
    name, 
    email, 
    phone, 
    location, 
    loan_amount, 
    stage, 
    priority, 
    credit_score, 
    income,
    loan_type,
    notes
) VALUES (
    'daf63630-64e4-4036-ad5d-d617c1ea618a',
    'John Doe',
    'john.doe@example.com',
    '(555) 123-4567',
    '123 Main St, Los Angeles, CA 90210',
    250000.00,
    'Initial Contact',
    'high',
    750,
    85000.00,
    'Mortgage',
    'Referred by existing client'
);

-- Create a client for better testing
INSERT INTO public.clients (
    user_id,
    name,
    email,
    phone,
    location,
    status,
    total_loans,
    total_loan_value
) VALUES (
    'daf63630-64e4-4036-ad5d-d617c1ea618a',
    'Jane Smith',
    'jane.smith@example.com',
    '(555) 987-6543',
    '456 Oak Ave, San Francisco, CA 94102',
    'Active',
    1,
    150000.00
);