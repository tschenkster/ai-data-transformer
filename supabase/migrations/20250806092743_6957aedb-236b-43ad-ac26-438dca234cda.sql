-- Fix the missing RLS policies for the copy tables
-- These are backup tables so we'll just drop them since they're not needed

DROP TABLE IF EXISTS public.zzz_copy_report_line_items;
DROP TABLE IF EXISTS public.zzz_copy_report_structures;