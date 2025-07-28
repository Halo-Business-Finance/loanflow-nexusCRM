-- Drop and recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Also verify the user_role type exists and check the user_roles table structure
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'user_roles' AND table_schema = 'public';

-- Check if the enum exists
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');