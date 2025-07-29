-- Give the user an active role so they can be properly managed
INSERT INTO user_roles (user_id, role, is_active) 
VALUES ('722f2f47-da2d-48d7-8041-2fb2a39fa229', 'agent', true)
ON CONFLICT DO NOTHING;