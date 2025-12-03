
-- Create employees directory table for sample data (not linked to auth)
CREATE TABLE public.employees_directory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  team TEXT NOT NULL,
  org_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees_directory ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view employees
CREATE POLICY "Authenticated users can view employees"
ON public.employees_directory
FOR SELECT
TO authenticated
USING (true);

-- Allow admins to manage employees
CREATE POLICY "Admins can manage employees"
ON public.employees_directory
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
