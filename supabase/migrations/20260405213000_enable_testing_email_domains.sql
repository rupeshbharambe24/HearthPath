INSERT INTO public.college_domains (domain, college_name, status)
VALUES
  ('gmail.com', 'Testing Gmail Access', 'active'),
  ('yahoo.com', 'Testing Yahoo Access', 'active'),
  ('outlook.com', 'Testing Outlook Access', 'active'),
  ('hotmail.com', 'Testing Hotmail Access', 'active'),
  ('icloud.com', 'Testing iCloud Access', 'active')
ON CONFLICT (domain) DO UPDATE
SET
  college_name = EXCLUDED.college_name,
  status = EXCLUDED.status;
