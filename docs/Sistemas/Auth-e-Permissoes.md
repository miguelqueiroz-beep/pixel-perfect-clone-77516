# 🔐 Autenticação e Permissões

Modelo de autenticação, JWT, RLS e controle de acesso.

---

## 🎯 Visão Geral

```
Usuário
  ├─ Signup/Login/OAuth Google (Supabase Auth)
  ├─ JWT gerado + salvo em localStorage
  ├─ A cada requisição: Bearer <JWT>
  └─ RLS policies filtram dados por user_id
```

---

## 🔐 Fluxo JWT

### 1. Signup → JWT criado

```
1. User submete email + password
2. Supabase Auth cria auth.users entry
3. Supabase gera JWT assinado com SUPABASE_SECRET_KEY
4. JWT payload:
   {
     "iss": "https://jtpizybfydlhxbpjenry.supabase.co/auth/v1",
     "sub": "<user_id>",     // Identifica usuário
     "aud": "authenticated",
     "exp": 1656789012,      // Expiração
     "iat": 1656785412,
     "email": "user@mail.com",
     "phone": "",
     "email_confirmed_at": "2026-06-29T...",
     "user_metadata": {},
     "aud": "authenticated",
     "role": "authenticated"
   }
5. JWT retornado ao cliente
6. Cliente salva: localStorage.setItem('sb-token', jwt)
```

### 1.1 Login com Google → JWT criado

```text
1. Usuário clica em "Continuar com Google"
2. Supabase inicia OAuth com Google e redireciona para consentimento
3. Google autentica o usuário e devolve a autorização ao Supabase
4. Supabase cria ou reutiliza a conta e emite a sessão/JWT
5. Cliente recebe a sessão via redirect e `onAuthStateChange`
6. JWT passa a valer do mesmo jeito que no login por e-mail/senha
```

### 2. Requisição → Bearer Token validado

```
GET /dashboard
Header: Authorization: Bearer <JWT>

SSR Middleware (auth-middleware.ts):
├─ Extrai token do header
├─ Valida JWT (sem verificar assinatura — confia em Supabase)
├─ Extrai sub = user_id
├─ Passa para queries: SELECT * WHERE auth.uid() = user_id
└─ RLS policy verifica novamente
```

### 3. Expiração → Refresh Token

```
Token expirado? (exp < now())
├─ Supabase detecta automaticamente
├─ Realiza refresh automático (if persistSession=true)
├─ localStorage atualizado
└─ Nova requisição com novo token
```

---

## 🛡️ Row-Level Security (RLS)

### Conceito

```
Cada linha de dados tem um "dono" (user_id)
RLS policy garante que:
  - User A só vê dados dele
  - User B nunca vê dados de A
  - Mesmo que SQL seja "SELECT *", RLS filtra
```

### Policies Implementadas

#### 1. Profiles

```sql
-- SELECT: Cada user vê só seu perfil
CREATE POLICY "own profile select" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- INSERT: Ao criar, deve ser do próprio usuário
CREATE POLICY "own profile insert" ON profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Só editar o seu
CREATE POLICY "own profile update" ON profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### 2. Accounts, Transactions, Budgets, Goals

```sql
-- ALL operations: Seu user_id obrigatório
CREATE POLICY "own accounts all" ON accounts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 3. Categories (Especial)

```sql
-- SELECT: Ver suas categorias OU categorias system
CREATE POLICY "categories select own or system" ON categories
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_system = true);

-- INSERT: Criar categorias (não system)
CREATE POLICY "categories insert own" ON categories
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND is_system = false);

-- UPDATE: Editar apenas suas (não system)
CREATE POLICY "categories update own" ON categories
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND is_system = false)
WITH CHECK (auth.uid() = user_id AND is_system = false);
```

---

## ⚠️ RLS Pitfalls

### Pitfall 1: Esquecer user_id em INSERT

```sql
-- ❌ ERRADO
INSERT INTO transactions (amount, date, category_id, account_id)
VALUES (100, '2026-06-29', 'cat1', 'acc1');
-- RLS rejeita porque não há user_id (ou é diferente do auth.uid())

-- ✅ CERTO
INSERT INTO transactions (user_id, amount, date, category_id, account_id)
VALUES (auth.uid(), 100, '2026-06-29', 'cat1', 'acc1');
```

### Pitfall 2: RLS silencioso em SELECT

```sql
-- Query válida, retorna vazio (porque RLS filtrou)
SELECT * FROM transactions; -- User A não vê dados dele

-- Debug:
-- 1. Verificar `auth.uid()` retorna valor?
-- 2. Verificar policy com: EXPLAIN ANALYZE SELECT ...
-- 3. Verificar role do usuário (authenticated?)
```

### Pitfall 3: FK violada por RLS

```
User A tenta:
  INSERT transactions (user_id = user_A, account_id = account_B)
  
Account B pertence a User B.
RLS em accounts bloqueia User A de VER account_B.
Resultado: Erro "account_id não existe" (na verdade, não é visível)
```

---

## 🔑 Roles e Permissões

### Supabase Roles

| Role | Acesso | Uso |
|------|--------|-----|
| `authenticated` | Usuário logado | 99% das operações |
| `anon` | Não logado | Signup, login apenas |
| `service_role` | Backend interno | Triggers, funções admin |

### Granularidade por Operação

```sql
-- SELECT apenas para autenticado
GRANT SELECT ON transactions TO authenticated;

-- INSERT/UPDATE/DELETE apenas para autenticado
GRANT INSERT, UPDATE, DELETE ON transactions TO authenticated;

-- Service role (internal only)
GRANT ALL ON transactions TO service_role;

-- Anon não pode fazer NADA (explícito)
REVOKE ALL ON transactions FROM anon;
```

---

## 📝 Triggers (Auto-atualizar dados)

### Trigger 1: profiles.updated_at

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
```

**Efeito:** Toda vez que editar qualquer coluna, `updated_at` vira agora().

### Trigger 2: handle_new_user (Future)

```sql
-- Quando novo usuário criado em auth.users,
-- criar entry em profiles automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, '');  -- Default vazio
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🧪 Teste: RLS

### Teste 1: User A não vê dados de User B

```
1. Login como User A
2. SELECT transactions
   → Vê 5 transações (suas)
3. Logout
4. Login como User B
5. SELECT transactions
   → Vê 3 transações (suas, não as de A)
```

### Teste 2: Editar categoria system falha

```
1. Login como User A
2. UPDATE categories SET name='Novo' WHERE id='cat_system_salary'
   → Erro: "update violates row level security policy"
   (porque is_system=true e policy bloqueia)
```

### Teste 3: FK sem RLS permite acesso cruzado

```
❌ PERIGO (sem RLS adicional):
1. User A vê category_id de User B (FK pública)
2. User A cria transaction com category_id='cat_B'
3. RLS em categories bloqueia? Não! (constraints em FK não verificam RLS)
4. Resultado: User A consegue usar categoria de User B

✅ SOLUÇÃO: RLS em transactions deve incluir:
   AND category_id IN (SELECT id FROM categories WHERE user_id = auth.uid() OR is_system = true)
```

---

## 🔐 Secrets & Env Vars

### O que é secreto

```
❌ NUNCA expor:
- SUPABASE_SECRET_KEY (chave privada)
- database password
- API keys de integrações

✅ PODE expor:
- VITE_SUPABASE_URL (endpoint público)
- VITE_SUPABASE_PUBLISHABLE_KEY (chave pública, pro cliente)
- Project ID
```

### Como guardar secrets

```
Local: .env.local (não comitar)
  ├─ SUPABASE_SECRET_KEY=eyJ...
  └─ SUPABASE_URL=https://...

Production: Lovable Cloud painel
  ├─ Environment Variables
  └─ Valores salvos criptografados
```

---

## 🚨 Cenários de Segurança

### Cenário 1: Token roubado

```
Adversário obtém JWT de localStorage (XSS)
├─ Pode fazer requisições como o usuário
├─ Só acessa dados do usuário (RLS protege)
├─ Não pode acessar dados de outros usuários
└─ Token expira em 24h (Supabase default)

Mitigação:
- Rolar chave SUPABASE_SECRET_KEY (invalida tokens antigos)
- Implementar logout em todos os devices
- Usar httpOnly cookies (futuro, mais seguro que localStorage)
```

### Cenário 2: SQL Injection

```
Usuário tenta:
  POST /transactions
  { amount: "100; DROP TABLE transactions; --" }

Parameterized queries (Supabase usa Postgrest):
├─ Interpolação segura
├─ Tipagem TypeScript de Zod
└─ Input é tratado como valor, não comando

Resultado: Seguro ✅
```

### Cenário 3: Privilégio Escalation

```
User A tenta se passar por User B:
  INSERT transactions (user_id = 'user_B_id', ...)

RLS valida:
  WHERE auth.uid() = user_id
  → auth.uid() retorna 'user_A_id'
  → user_A_id ≠ 'user_B_id'
  → INSERT falha ✅
```

---

## 📚 Relacionado

- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Variáveis de Ambiente:** [[../Arquitetura/Variáveis-de-Ambiente.md]]
- **Modelo de Ameaças:** [[../Segurança/Modelo-de-Ameacas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
