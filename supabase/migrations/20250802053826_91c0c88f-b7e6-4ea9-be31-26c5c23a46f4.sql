-- Create the report_structures table
CREATE TABLE public.report_structures (
  report_structure_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_structure_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_user_id UUID NOT NULL,
  created_by_user_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

-- Create the report_line_items table
CREATE TABLE public.report_line_items (
  report_line_item_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_structure_id UUID NOT NULL REFERENCES public.report_structures(report_structure_id) ON DELETE CASCADE,
  report_structure_name TEXT NOT NULL,
  report_line_item_key TEXT NOT NULL,
  parent_report_line_item_key TEXT,
  is_parent_key_existing BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hierarchy_path TEXT,
  level_1_line_item_description TEXT,
  level_2_line_item_description TEXT,
  level_3_line_item_description TEXT,
  level_4_line_item_description TEXT,
  level_5_line_item_description TEXT,
  level_6_line_item_description TEXT,
  level_7_line_item_description TEXT,
  line_item_type TEXT,
  description_of_leaf TEXT,
  is_leaf BOOLEAN DEFAULT false,
  is_calculated BOOLEAN DEFAULT false,
  display BOOLEAN DEFAULT true,
  data_source TEXT,
  comment NUMERIC
);

-- Enable Row Level Security
ALTER TABLE public.report_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_line_items ENABLE ROW LEVEL SECURITY;

-- Create policies for report_structures
CREATE POLICY "Admins can view all report structures" 
ON public.report_structures 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert report structures" 
ON public.report_structures 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report structures" 
ON public.report_structures 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete report structures" 
ON public.report_structures 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Users can view active report structures" 
ON public.report_structures 
FOR SELECT 
USING (is_active = true);

-- Create policies for report_line_items
CREATE POLICY "Admins can view all report line items" 
ON public.report_line_items 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can insert report line items" 
ON public.report_line_items 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update report line items" 
ON public.report_line_items 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete report line items" 
ON public.report_line_items 
FOR DELETE 
USING (is_admin_user());

CREATE POLICY "Users can view line items from active structures" 
ON public.report_line_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.report_structures 
    WHERE report_structures.report_structure_id = report_line_items.report_structure_id 
    AND report_structures.is_active = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_report_structures_active ON public.report_structures(is_active);
CREATE INDEX idx_report_structures_created_by ON public.report_structures(created_by_user_id);
CREATE INDEX idx_report_line_items_structure_id ON public.report_line_items(report_structure_id);
CREATE INDEX idx_report_line_items_parent_key ON public.report_line_items(parent_report_line_item_key);
CREATE INDEX idx_report_line_items_sort_order ON public.report_line_items(sort_order);
CREATE INDEX idx_report_line_items_is_leaf ON public.report_line_items(is_leaf);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_report_structures_updated_at
  BEFORE UPDATE ON public.report_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to ensure only one active structure
CREATE OR REPLACE FUNCTION public.ensure_single_active_structure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.report_structures 
    SET is_active = false 
    WHERE report_structure_id != NEW.report_structure_id 
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one active structure
CREATE TRIGGER ensure_single_active_structure_trigger
  BEFORE INSERT OR UPDATE OF is_active ON public.report_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_structure();