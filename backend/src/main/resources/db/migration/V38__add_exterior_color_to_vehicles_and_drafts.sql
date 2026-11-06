-- EVShare 3D - Phase 25 Vehicle Exterior Color Support
-- Adds exterior_color column to vehicles and vehicle_registration_drafts tables

ALTER TABLE vehicles 
    ADD COLUMN exterior_color VARCHAR(50) DEFAULT 'Trắng ngọc trai';

ALTER TABLE vehicle_registration_drafts 
    ADD COLUMN exterior_color VARCHAR(50) DEFAULT 'Trắng ngọc trai';

-- Update seeded demo vehicles with specific colors
UPDATE vehicles 
SET exterior_color = 'Trắng ngọc trai' 
WHERE id = '11111111-1111-1111-1111-111111111111' AND (exterior_color IS NULL OR exterior_color = '');

UPDATE vehicles 
SET exterior_color = 'Hổ phách' 
WHERE id = '11111111-1111-1111-1111-111111111102' AND (exterior_color IS NULL OR exterior_color = '');

