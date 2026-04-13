DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'demarieya';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant demarieya not found — run M1 seed first';
  END IF;

  UPDATE profiles SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE students SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE behavioral_incidents SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE sessions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE success_plans SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
  UPDATE ai_analyses SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;

  RAISE NOTICE 'Backfill complete for tenant: %', v_tenant_id;
END $$;
