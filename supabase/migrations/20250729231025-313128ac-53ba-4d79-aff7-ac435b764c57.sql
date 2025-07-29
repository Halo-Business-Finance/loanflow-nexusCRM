-- Manually delete the Jason Kinter user record that wasn't properly deleted
DELETE FROM profiles WHERE id = '722f2f47-da2d-48d7-8041-2fb2a39fa229';

-- Also ensure any lingering user_roles are deleted
DELETE FROM user_roles WHERE user_id = '722f2f47-da2d-48d7-8041-2fb2a39fa229';

-- Clean up any user sessions
DELETE FROM user_sessions WHERE user_id = '722f2f47-da2d-48d7-8041-2fb2a39fa229';

-- Clean up any notifications
DELETE FROM notifications WHERE user_id = '722f2f47-da2d-48d7-8041-2fb2a39fa229';