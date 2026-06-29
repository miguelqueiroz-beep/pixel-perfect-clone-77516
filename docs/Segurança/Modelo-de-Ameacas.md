# 🔒 Modelo de Ameaças

Análise de segurança, vulnerabilidades potenciais e mitigações.

---

## 🎯 Escopo

- **Dados protegidos:** Transações, contas, metas (financeiro pessoal)
- **Ativos críticos:** Autenticação, autorização (RLS), dados do usuário
- **Usuários:** Indivíduos comuns (sem contexto de defesa avançada)
- **Ameaças típicas:** XSS, autenticação fraca, vazamento de dados

---

## 🚨 Ameaças Identificadas

### CRÍTICO

#### 1. XSS (Cross-Site Scripting) em localStorage

**Ameaça:** Invasor injeta JS que rouba JWT de localStorage

```javascript
// ❌ Risco:
localStorage.getItem('sb-token')  // Acessível via console
```

**Impacto:** Token roubado → Acesso como usuário

**Mitigação:**
- ✅ Usar httpOnly cookies (futuro, TanStack Start pode suportar)
- ✅ CSP (Content Security Policy) headers
- ✅ Sanitizar inputs em Radix UI (já faz)

---

#### 2. Força bruta em login

**Ameaça:** Bot tenta múltiplos email/password

**Impacto:** Conta hackeada

**Mitigação:**
- ⚠️ Supabase Auth já implementa rate-limiting (30 req/min)
- 🔲 Adicionar CAPTCHA após N tentativas falhas (futuro)

---

#### 3. RLS Misconfiguration

**Ameaça:** Policy escrita errada permite user A ver dados de user B

```sql
-- ❌ ERRADO: User B vê dados de A
CREATE POLICY "select all" ON transactions
FOR SELECT TO authenticated
USING (true);  -- Permite tudo!

-- ✅ CERTO: User B vê apenas seus dados
CREATE POLICY "select own" ON transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

**Impacto:** Vazamento massivo

**Mitigação:**
- ✅ Todas as policies implementadas corretamente
- ✅ Review de RLS a cada alteração no [[Mapa-de-Regressão.md]]
- 🔲 Teste automatizado de RLS (futuro)

---

### ALTO

#### 4. SQL Injection (via Postgrest)

**Ameaça:** Usuário injeta SQL em campos

```javascript
// ❌ Tentativa (já seguro):
POST /transactions { description: "'; DROP TABLE users; --" }
```

**Impacto:** Destruição de dados

**Mitigação:**
- ✅ Postgrest usa prepared statements (safe)
- ✅ Zod valida tipos antes de enviar
- ✅ TypeScript type-safety

---

#### 5. CSRF (Cross-Site Request Forgery)

**Ameaça:** Site malicioso força usuário a fazer ação

```html
<!-- Malicioso site -->
<img src="https://finflow.app/api/transactions?delete=true" />
```

**Impacto:** User A deleta dados sem saber

**Mitigação:**
- ⚠️ TanStack Start pode gerenciar CSRF tokens (verify)
- ✅ POST/DELETE requerem JSON body (não aceita formulários simples)
- ✅ SameSite cookies (futuro)

---

#### 6. Secrets em .env.local commitados

**Ameaça:** Dev commita arquivo `.env.local` com chaves

```bash
git add .env.local  # ❌ Ops!
git push
```

**Impacto:** Secrets expostos em GitHub

**Mitigação:**
- ✅ `.env.local` em `.gitignore`
- ✅ `.env.example` (template) commitado
- 🔲 git hooks para validar (futuro)
- **Se acontecer:** Regenerar chaves Supabase imediatamente

---

### MÉDIO

#### 7. Session Fixation

**Ameaça:** Invasor força usuário a usar session dele

**Impacto:** Invasor vira o usuário

**Mitigação:**
- ✅ JWT (não session-based) — harder to hijack
- ✅ Token expira em 24h
- ✅ Supabase gerencia refresh automático

---

#### 8. PII (Personally Identifiable Information) Exposure

**Ameaça:** Email/nome/dados financeiros em logs

**Impacto:** Privacy violation

**Mitigação:**
- ✅ Senhas nunca aparecem em logs (Supabase gerencia)
- ⚠️ Lovable error reporting captura email
- 🔲 Redactar PII em logs (futuro)

---

#### 9. Insecure Direct Object Reference (IDOR)

**Ameaça:** User A acessa `/transactions/123` de User B

```javascript
// ❌ Risco (sem validação):
GET /api/transactions/123  // Ninguém valida que 123 é de A
```

**Impacto:** User A vê transação de B

**Mitigação:**
- ✅ RLS filtra no server
- ✅ Server-side middleware valida auth.uid() = user_id
- ✅ Frontend não faz "confiança" em IDs da URL

---

#### 10. Dados Sensíveis em Memory

**Ameaça:** Devtools mostra transações em Redux/React Query cache

**Impacto:** Alguém com acesso ao dispositivo vê dados

**Mitigação:**
- ⚠️ React Query armazena em memory (normal)
- ✅ localStorage cleared on logout
- 🔲 Memory encryption (futuro, overhead alto)

---

## 🔑 Controle de Acesso

### Autenticação (WHO)

```
┌─────────────────────┐
│  Usuário            │
├─────────────────────┤
│ Email + Password    │
│ ↓                   │
│ Supabase Auth       │
│ ↓                   │
│ JWT gerado          │
│ ↓                   │
│ localStorage        │
│ ↓                   │
│ Bearer header       │
│ ↓                   │
│ RLS policy          │
│ ↓                   │
│ ✓ Autenticado       │
└─────────────────────┘
```

**Flow:**
1. User faz login
2. Supabase retorna JWT
3. App salva em localStorage
4. A cada requisição: `Authorization: Bearer <JWT>`
5. SSR middleware valida token
6. RLS filtra dados por user_id

---

### Autorização (WHAT)

```
┌────────────────────────────┐
│ User A (id=uuid_a)         │
├────────────────────────────┤
│ Pode:                      │
│ ✓ Ver suas transações      │
│ ✓ Editar suas metas        │
│ ✗ Ver transações de User B │
│ ✗ Deletar contas de User B │
│                            │
│ Implementado via:          │
│ - RLS policies (DB level)  │
│ - Frontend checks (UX)     │
└────────────────────────────┘
```

**Exemplo RLS:**
```sql
CREATE POLICY "own transactions" ON transactions
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 🛡️ Checklist de Segurança

- [ ] Todas as tabelas têm RLS policies?
- [ ] .env.local está em .gitignore?
- [ ] Secrets NUNCA aparecem em código?
- [ ] VITE_ vars SÃO públicas (não colocar secrets)?
- [ ] JWT validation em middleware?
- [ ] Zod valida todos os inputs?
- [ ] Senhas com mín 8 chars?
- [ ] HTTPS em produção (Lovable garante)?
- [ ] Cors headers configurados? ⚠️ A confirmar

---

## 🧪 Teste: Segurança

### Teste 1: RLS funciona

```
1. User A cria transação TX_A
2. User B tenta: SELECT * FROM transactions WHERE id = TX_A
3. ❌ RLS bloqueia (vazio)
```

### Teste 2: JWT expirado

```
1. Pega token, aguarda expiração (24h)
2. Tenta requisição
3. ❌ 401 Unauthorized
4. Client refetch com novo token
```

### Teste 3: CSRF (formulário simples)

```
1. Site malicioso tenta: <form action="finflow.app/api/txs" method="POST">
2. Manda ao usuário (em outro tab)
3. ❌ Bloqueia (JSON body obrigatório)
```

---

## 🔄 Auditoria & Logs

### Atualmente implementado

- ✅ Lovable error reporting (erros)
- ✅ Supabase realtime (mudanças)

### Recomendado (Futuro)

```sql
-- Tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  table_name TEXT,
  action TEXT,  -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para cada tabela
CREATE TRIGGER transactions_audit
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION log_audit_event();
```

---

## 📚 Relacionado

- **Auth e Permissões:** [[../Sistemas/Auth-e-Permissoes.md]]
- **Banco de Dados:** [[../Arquitetura/Banco-de-Dados.md]]
- **Variáveis de Ambiente:** [[../Arquitetura/Variáveis-de-Ambiente.md]]
- **Integrações:** [[../Arquitetura/Integrações-Externas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Próxima auditoria:** Recomendado a cada 6 meses
