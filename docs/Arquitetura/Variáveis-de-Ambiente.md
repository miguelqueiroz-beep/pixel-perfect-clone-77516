# 🔐 Variáveis de Ambiente

Todas as variáveis usadas no projeto, suas funções, valores e onde usadas.

---

## 📋 Tabela completa

| Variável | Escopo | Valor exemplo | Onde usada | Tipo | Notas |
|----------|--------|----------------|-----------|------|-------|
| `VITE_SUPABASE_URL` | Client | `https://jtpizybfydlhxbpjenry.supabase.co` | [src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts) | URL | Endpoint Supabase (public) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | `eyJhbGc...` (prefixo `sb_pb_`) | [src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts) | Key | Chave pública (safe in browser) |
| `SUPABASE_URL` | Server | `https://jtpizybfydlhxbpjenry.supabase.co` | [src/integrations/supabase/auth-middleware.ts](../src/integrations/supabase/auth-middleware.ts) (server-side) | URL | Endpoint Supabase (server-only) |
| `SUPABASE_PUBLISHABLE_KEY` | Server | `eyJhbGc...` (prefixo `sb_pb_`) | [src/integrations/supabase/auth-middleware.ts](../src/integrations/supabase/auth-middleware.ts) | Key | Chave pública no servidor |
| `SUPABASE_SECRET_KEY` | Server | `eyJhbGc...` (prefixo `sb_secret_`) | [src/integrations/supabase/auth-middleware.ts](../src/integrations/supabase/auth-middleware.ts) | Key | **SEGREDO** — nunca expor em cliente |

---

## 🔧 Como configurar

### Desenvolvimento Local

#### 1. Criar arquivo `.env.local` na raiz

```bash
# .env.local (NÃO COMITAR!)
VITE_SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SECRET_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. Obter valores do Supabase

Acesse [supabase.com/dashboard](https://supabase.com/dashboard):
1. Selecione projeto `FinFlow`
2. Settings → API → Copy URL e chaves
3. Project settings → API Keys → Copy secret (⚠️ não compartilhar)

#### 3. Arquivo `.env.example` (comitar)

```bash
# .env.example (COMITAR - template seguro)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

**Novo dev clona e faz:**
```bash
cp .env.example .env.local
# Preenchê-lo com valores reais
```

---

### Lovable Cloud (Produção)

1. Acesse painel Lovable
2. Project Settings → Environment Variables
3. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Deploy automático

**⚠️ Cuidado:** Valores salvos no painel são visíveis apenas para admins.

---

## 🛡️ Segurança

### Regra de Ouro
```
✅ VITE_ prefix = acessível em client-side (browser JavaScript)
   → Pode expor URLs públicas, chaves "publishable"

❌ SEM prefix = server-only (Nitro/Node.js)
   → NUNCA usar import.meta.env aqui
   → Sempre usar process.env
   → NUNCA expor secrets aqui
```

### Checklist de Segurança

- [ ] `.env.local` está em `.gitignore`?
- [ ] Nenhum `.env.local` commited em git?
- [ ] `SUPABASE_SECRET_KEY` nunca aparece em código frontend?
- [ ] `VITE_` env vars SÃO públicas (não colocar secrets lá)?
- [ ] Em cada pull, validei env vars com `.env.example`?

---

## 🔄 Fluxo de env vars

```
┌─────────────────────────────────────────────────────┐
│  .env.local (local) / Lovable Panel (production)    │
│  VITE_SUPABASE_URL, SUPABASE_SECRET_KEY, etc.       │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
    ┌──────────────────┐  ┌──────────────────┐
    │  Vite Build Time │  │  Runtime (Nitro) │
    │                  │  │                  │
    │ Injeta VITE_*    │  │ import.meta.env  │
    │ em bundle        │  │ ou process.env   │
    └────────┬─────────┘  └────────┬─────────┘
             │                     │
    ┌────────▼──────────────────────▼──────────┐
    │  Browser JavaScript (React)               │
    │  Acessa: import.meta.env.VITE_SUPABASE_*  │
    │  Cria: supabase client                    │
    └──────────────────────────────────────────┘
```

---

## 🚨 Problemas comuns

### 1. `import.meta.env.VITE_SUPABASE_URL` é undefined

**Causa:** Variável não definida em `.env.local` ou não foi injetada.

**Solução:**
```bash
# Verificar .env.local existe
ls -la .env.local

# Verificar que contém VITE_ vars
cat .env.local | grep VITE_

# Reiniciar dev server
npm run dev  # Ctrl+C, então rodar novamente
```

### 2. `process.env.SUPABASE_SECRET_KEY` é undefined em servidor

**Causa:** Variável não definida em `.env.local` (server-side).

**Solução:** Adicionar em `.env.local`:
```env
SUPABASE_SECRET_KEY=eyJ...
```

### 3. "Missing Supabase environment variable(s)" erro no browser

**Causa:** Vite não conseguiu injetar `VITE_SUPABASE_*`.

**Solução:**
```bash
# Limpar cache Vite
rm -rf node_modules/.vite

# Reinstalar deps
npm install

# Rodar dev novamente
npm run dev
```

### 4. Secrets vazados em commit

**Se acontecer:**
```bash
# 1. Encontrar o commit
git log --all --source --remotes -S 'sb_secret_' -- .env.local

# 2. Regenerar secrets no Supabase painel
# Settings → API Keys → Regenerate

# 3. Force-push para remover commit (⚠️ apenas se repo privado)
git revert <commit-hash>
git push

# 4. Informar time que secrets foram comprometidas
```

---

## 🌍 Staging vs Production

### Staging (develop branch / preview env)

```env
# .env.example (staging)
# Usar projeto Supabase staging (se houver)
VITE_SUPABASE_URL=https://staging-jtpizybfydlhxbpjenry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...staging...
SUPABASE_SECRET_KEY=eyJ...staging...
```

**⚠️ A confirmar:** Lovable tem staging branch? Se não, usar main = production.

### Production (main branch)

```env
# .env.example (production)
# Projeto Supabase produção
VITE_SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...prod...
SUPABASE_SECRET_KEY=eyJ...prod...
```

---

## 📝 Adicionando nova env var

### Passo a passo

1. **Decidir escopo:** client (VITE_) ou server (sem prefix)?
2. **Adicionar em `.env.example`:**
   ```env
   NEW_VITE_MY_VAR=
   ```
3. **Adicionar em `.env.local`:**
   ```env
   NEW_VITE_MY_VAR=valor
   ```
4. **Usar no código:**
   ```typescript
   // Client-side
   const value = import.meta.env.NEW_VITE_MY_VAR;
   
   // Server-side
   const value = process.env.NEW_MY_VAR;
   ```
5. **Adicionar em Lovable painel** (se produção)
6. **Documentar aqui** (adicionar em tabela acima)

---

## 🔗 Supabase API

### Obter chaves

Painel Supabase → Project Settings → API

- **URL:** Seu endpoint `https://...supabase.co`
- **Publishable Key (anon):** Chave pública para cliente
- **Secret Key:** Chave privada para servidor (**SEGREDO**)

### Verificar valores

```bash
# Listar env vars definidas
env | grep VITE_
env | grep SUPABASE_

# Verificar que chaves são válidas (parsing JWT)
# Copiá-la, ir para jwt.io, colar em "Encoded"
```

---

## 📚 Relacionado

- **Integrações Externas:** [[Integrações-Externas.md]]
- **Setup Local:** [[../Operacao/Setup-Local.md]]
- **Deploy:** [[../Operacao/Deploy.md]]
- **Segurança:** [[../Segurança/Modelo-de-Ameacas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Rotação de secrets:** Recomendado a cada 90 dias
