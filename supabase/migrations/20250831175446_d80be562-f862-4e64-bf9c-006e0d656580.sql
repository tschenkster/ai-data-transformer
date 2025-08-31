-- Update report_structures table to track source language
UPDATE report_structures 
SET source_language_code = 'de' 
WHERE source_language_code IS NULL;

-- Update report_line_items table to track source language for existing items
UPDATE report_line_items 
SET source_language_code = 'de' 
WHERE source_language_code IS NULL;