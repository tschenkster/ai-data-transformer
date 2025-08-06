-- Update sequence starting values using correct sequence names
-- Set report_structures sequence to start at 100
ALTER SEQUENCE report_structures_new_report_structure_id_seq1 RESTART WITH 100;

-- Set report_line_items sequence to start at 1000  
ALTER SEQUENCE report_line_items_new_report_line_item_id_seq1 RESTART WITH 1000;