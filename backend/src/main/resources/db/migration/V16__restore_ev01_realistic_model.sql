-- EVShare 3D - Phase 16: Restore EV01 Realistic 3D Model
-- Authoritative Model Rule:
-- EV01 MUST use primary digital twin asset: /models/ev01-realistic.glb
-- Fallback asset: /models/ev-car.glb

UPDATE vehicles
SET model_3d_url = '/models/ev01-realistic.glb'
WHERE id = '11111111-1111-1111-1111-111111111111';
