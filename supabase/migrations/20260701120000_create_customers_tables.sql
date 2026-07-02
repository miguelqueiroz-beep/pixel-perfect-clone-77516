CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- CUSTOMERS
-- =========================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document_number TEXT,
  company_name TEXT,
  birth_date DATE,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_full_name_not_empty CHECK (length(btrim(full_name)) > 0)
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

CREATE POLICY "own customers all" ON public.customers
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX customers_user_idx ON public.customers(user_id);
CREATE INDEX customers_user_name_idx ON public.customers(user_id, full_name);
CREATE UNIQUE INDEX customers_user_email_unique ON public.customers(user_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX customers_user_document_unique ON public.customers(user_id, document_number) WHERE document_number IS NOT NULL;

-- Needed so addresses can reference both the customer and the owner.
ALTER TABLE public.customers
  ADD CONSTRAINT customers_id_user_unique UNIQUE (id, user_id);

-- =========================
-- CUSTOMER ADDRESSES
-- =========================
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Principal',
  postal_code TEXT,
  street TEXT NOT NULL DEFAULT '',
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Brasil',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customer_addresses_customer_owner_fk
    FOREIGN KEY (customer_id, user_id)
    REFERENCES public.customers(id, user_id)
    ON DELETE CASCADE
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

CREATE POLICY "own customer addresses all" ON public.customer_addresses
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX customer_addresses_user_idx ON public.customer_addresses(user_id);
CREATE INDEX customer_addresses_customer_idx ON public.customer_addresses(customer_id);
CREATE UNIQUE INDEX customer_addresses_primary_unique ON public.customer_addresses(customer_id) WHERE is_primary;

CREATE TRIGGER trg_customers_updated
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_customer_addresses_updated
BEFORE UPDATE ON public.customer_addresses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();