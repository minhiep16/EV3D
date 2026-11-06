-- EVShare 3D - Phase 26: Align EV01 Demo Vehicle with its canonical Blue paint
-- Resolves color discrepancy where EV01 was unintentionally seeded as 'Trắng ngọc trai'
UPDATE vehicles 
SET exterior_color = 'Xanh đại dương' 
WHERE id = '11111111-1111-1111-1111-111111111111';

