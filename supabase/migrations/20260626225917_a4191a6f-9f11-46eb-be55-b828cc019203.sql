
-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  main_income NUMERIC(14,2),
  income_day SMALLINT CHECK (income_day BETWEEN 1 AND 31),
  financial_goals TEXT[] DEFAULT '{}',
  estimated_monthly_expenses NUMERIC(14,2),
  use_budget BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================
-- ACCOUNTS
-- =========================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking','savings','wallet','credit_card','investment','other')),
  initial_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(14,2),
  color TEXT NOT NULL DEFAULT '#10B981',
  icon TEXT NOT NULL DEFAULT 'wallet',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts all" ON public.accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX accounts_user_idx ON public.accounts(user_id);

-- =========================
-- CATEGORIES
-- =========================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','both')),
  icon TEXT NOT NULL DEFAULT 'tag',
  color TEXT NOT NULL DEFAULT '#10B981',
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories select own or system" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_system = true);
CREATE POLICY "categories insert own" ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "categories update own" ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_system = false) WITH CHECK (auth.uid() = user_id AND is_system = false);
CREATE POLICY "categories delete own" ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_system = false);
CREATE INDEX categories_user_idx ON public.categories(user_id);

-- =========================
-- TRANSACTIONS
-- =========================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  date DATE NOT NULL,
  income_type TEXT CHECK (income_type IN ('salary','freelance','investment','sale','gift','refund','dividends','other')),
  payment_method TEXT CHECK (payment_method IN ('cash','debit','credit','pix','bank_slip','transfer')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  installment_group_id UUID,
  installment_number SMALLINT,
  installment_total SMALLINT,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid','pending')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions all" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tx_user_date_idx ON public.transactions(user_id, date DESC);
CREATE INDEX tx_user_kind_idx ON public.transactions(user_id, kind);
CREATE INDEX tx_user_category_idx ON public.transactions(user_id, category_id);
CREATE INDEX tx_installment_idx ON public.transactions(installment_group_id);
CREATE INDEX tx_tags_idx ON public.transactions USING GIN(tags);

-- =========================
-- BUDGETS
-- =========================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('general','category')),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  limit_amount NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
  reference_month DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budgets_category_required CHECK ((scope = 'category' AND category_id IS NOT NULL) OR (scope = 'general' AND category_id IS NULL))
);
CREATE UNIQUE INDEX budgets_unique_scope ON public.budgets(user_id, scope, COALESCE(category_id::text,''), reference_month);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own budgets all" ON public.budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- GOALS
-- =========================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
  saved_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  deadline DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  color TEXT NOT NULL DEFAULT '#10B981',
  icon TEXT NOT NULL DEFAULT 'target',
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals all" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_contributions TO authenticated;
GRANT ALL ON public.goal_contributions TO service_role;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contributions all" ON public.goal_contributions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_budgets_updated BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- On signup: create profile + seed default categories + default account
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.accounts (user_id, name, type, initial_balance, color, icon)
  VALUES (NEW.id, 'Conta principal', 'checking', 0, '#10B981', 'wallet');

  INSERT INTO public.categories (user_id, name, type, icon, color) VALUES
    (NEW.id, 'Salário', 'income', 'briefcase', '#10B981'),
    (NEW.id, 'Freelance', 'income', 'laptop', '#34D399'),
    (NEW.id, 'Investimentos', 'income', 'trending-up', '#06B6D4'),
    (NEW.id, 'Outras receitas', 'income', 'plus-circle', '#22D3EE'),
    (NEW.id, 'Alimentação', 'expense', 'utensils', '#F59E0B'),
    (NEW.id, 'Mercado', 'expense', 'shopping-cart', '#F97316'),
    (NEW.id, 'Transporte', 'expense', 'car', '#EF4444'),
    (NEW.id, 'Combustível', 'expense', 'fuel', '#DC2626'),
    (NEW.id, 'Moradia', 'expense', 'home', '#8B5CF6'),
    (NEW.id, 'Saúde', 'expense', 'heart-pulse', '#EC4899'),
    (NEW.id, 'Educação', 'expense', 'graduation-cap', '#6366F1'),
    (NEW.id, 'Lazer', 'expense', 'gamepad-2', '#A855F7'),
    (NEW.id, 'Assinaturas', 'expense', 'repeat', '#14B8A6'),
    (NEW.id, 'Internet', 'expense', 'wifi', '#0EA5E9'),
    (NEW.id, 'Energia', 'expense', 'zap', '#EAB308'),
    (NEW.id, 'Outros', 'expense', 'more-horizontal', '#64748B');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
