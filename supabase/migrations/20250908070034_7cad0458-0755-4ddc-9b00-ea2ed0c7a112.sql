-- Fix incorrect language_code_original values in ui_translations
-- English UI keys should have 'en' as language_code_original, not 'de'

UPDATE ui_translations 
SET language_code_original = 'en'
WHERE language_code_original = 'de' 
  AND (
    -- Check if ui_key contains English words/patterns
    ui_key ~ '^[A-Z_]+$' OR  -- All caps with underscores (typical English UI keys)
    ui_key ILIKE '%MENU_%' OR
    ui_key ILIKE '%BTN_%' OR  
    ui_key ILIKE '%NAV_%' OR
    ui_key ILIKE '%LABEL_%' OR
    ui_key ILIKE '%MSG_%' OR
    ui_key ILIKE '%ERROR_%' OR
    ui_key ILIKE '%SUCCESS_%' OR
    ui_key ILIKE '%WARNING_%' OR
    ui_key ILIKE '%INFO_%' OR
    -- Common English UI terms in original_text
    original_text ~* '(Profile|User|Management|Dashboard|Account|Reports|Structure|Admin|Home|Convert|Entity|System|Tools|Activity|Log|Memory|Maintenance|Cancel|Save|Delete|Edit|Create|Update|View|Settings|Language|Preferences|Interface|Content|Login|Logout|Register|Password|Email|Name|Description|Status|Active|Inactive|Enabled|Disabled|Search|Filter|Sort|Export|Import|Upload|Download|Print|Preview|Refresh|Reset|Clear|Apply|Submit|Confirm|Back|Next|Previous|Continue|Finish|Close|Open|Show|Hide|Expand|Collapse|Add|Remove|Select|Deselect)'
  );

-- Also update the original_text field to match if it currently contains German text
UPDATE ui_translations 
SET original_text = ui_key
WHERE language_code_original = 'en' 
  AND (original_text IS NULL OR original_text = '' OR original_text ~ '[äöüÄÖÜß]');