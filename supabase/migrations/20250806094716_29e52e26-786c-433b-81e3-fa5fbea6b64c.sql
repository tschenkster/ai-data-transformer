-- Update sequence starting values for report_structures and report_line_items
-- Set report_structures sequence to start at 100
ALTER SEQUENCE report_structures_report_structure_id_seq RESTART WITH 100;

-- Set report_line_items sequence to start at 1000  
ALTER SEQUENCE report_line_items_report_line_item_id_seq RESTART WITH 1000;