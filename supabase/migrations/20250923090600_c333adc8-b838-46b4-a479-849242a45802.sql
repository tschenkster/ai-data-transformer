-- Fix the function to have a proper search_path for security
CREATE OR REPLACE FUNCTION update_trial_balance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';