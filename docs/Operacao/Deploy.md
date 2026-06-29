# 🚀 Deploy

Como fazer build, deploy e gerenciar staging/production.

---

## 🏗️ Build Pipeline

```
git commit + git push
   ↓
GitHub webhook
   ↓
Lovable Cloud recebe evento
   ↓
Lovable clona repo
   ↓
npm run build (Vite)
   ↓
tsc --noEmit (type-check)
   ↓
Build sucesso?
├─ Sim: Deploy para Cloudflare Workers + CDN
├─ Não: Rollback automático + Email notificação
   ↓
Produção atualizada (5–10 min)
```

---

## 🔧 Build Local

### Teste build antes de pushar

```bash
# Limpar build anterior
rm -rf dist/

# Build produção (otimizado)
npm run build

# Saída esperada:
# > vite build
# ✓ X modules transformed
# dist/
#   ├── index.html
#   ├── _app/
#   └── ... [chunks otimizados]

# Tamanho esperado: ~500KB (gzipped ~150KB)
```

### Preview do build

```bash
npm run preview
# Abre http://localhost:4173 (simulando produção)
```

**Testes no preview:**
- [ ] Página carrega?
- [ ] Login funciona?
- [ ] Dashboard mostra dados?
- [ ] Transações carregam?

---

## 📤 Deploy para Lovable

### Pré-requisitos

1. Repo GitHub conectado a Lovable
2. Branch `main` = produção
3. Branch `develop` = staging (⚠️ verificar se está habilitado)
4. Env vars configuradas no painel Lovable

### Deploy Manual

```bash
# 1. Verificar que tudo está commitado
git status
# Nada deve estar "modified"

# 2. Lint + type-check
npm run lint
npm run tsc

# 3. Commit com mensagem descritiva
git commit -m "feat(dashboard): adicionar gráfico de receita vs despesa"

# 4. Push para main (produção) ou develop (staging)
git push origin main

# 5. Ir para painel Lovable e monitorar deployment
# https://lovable.dev/projects/[PROJECT_ID]/deployments
```

**Tempo:** ~5–10 minutos até estar live

### Verificar Deployment

```bash
# 1. Painel Lovable: Status deve mudar para "✅ Live"
# 2. Acesse produção: https://finflow.app (ou URL configurada)
# 3. Teste fluxo crítico: login → criar transação → dashboard
# 4. Verificar console (F12) para erros
```

---

## 🔄 Staging vs Produção

### Staging (develop branch) — ⚠️ A confirmar se existe

```
Branch: develop
Deploy automático: SIM (webhook)
URL: https://staging.finflow.app (ou similar)
Env vars: STAGING (banco dados test)
Propósito: QA antes de produção
```

**Fluxo:**
```
feature/xyz
   ↓
PR → develop
   ↓
Aprovado
   ↓
Merge → develop
   ↓
Lovable deploya para staging
   ↓
QA testa em staging
   ↓
PR → main
   ↓
Merge → main
   ↓
Deploy produção
```

### Produção (main branch)

```
Branch: main
Deploy automático: SIM (webhook)
URL: https://finflow.app
Env vars: PRODUCTION (banco dados real)
Propósito: Usuários reais
```

---

## 🔄 Rollback

### Se algo quebrou na produção

```bash
# Opção 1: Revert commit anterior
git revert HEAD
git push origin main
# Lovable re-deploya com código anterior

# Opção 2: Force-push anterior (⚠️ reescreve história)
git reset --hard origin/main~1
git push --force origin main
# ⚠️ APENAS se repo privado (Lovable reescreve história)
```

**Tempo:** ~5 min para efeito

---

## ⚠️ Ambiente Variables em Produção

### Configurar no Painel Lovable

1. Acesse painel Lovable
2. Project Settings → Environment Variables
3. Adicione:
   ```
   VITE_SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
   SUPABASE_URL=https://jtpizybfydlhxbpjenry.supabase.co
   SUPABASE_PUBLISHABLE_KEY=eyJ...
   SUPABASE_SECRET_KEY=eyJ... (SECRET)
   ```
4. Deploy automático ou manual

---

## 🔐 Secrets

### Armazenar secrets com segurança

```
❌ NUNCA commitar em .env.local
❌ NUNCA colocar em código

✅ SEMPRE em:
  - Lovable painel (durante deploy)
  - .env.local (local, NÃO commitar)
```

### Se secret foi exposto

```bash
# 1. Regenerar em Supabase
# Dashboard → Settings → API → Regenerate Keys

# 2. Atualizar Lovable painel
# Project Settings → Environment Variables

# 3. Força re-deploy
git commit --allow-empty -m "chore: regenerate secrets"
git push origin main
```

---

## 📊 Monitorar Deploy

### Logs do Lovable

Acesse: `https://lovable.dev/projects/[ID]/logs`

```
[2026-06-29T14:30:00Z] Build started
[2026-06-29T14:30:15Z] npm run build
[2026-06-29T14:30:45Z] ✓ Build succeeded
[2026-06-29T14:31:00Z] Deploying to Cloudflare Workers
[2026-06-29T14:31:30Z] ✅ Deploy complete
```

### Verificar saúde

```bash
# 1. Acesse site
# 2. Abra DevTools (F12)
# 3. Vá para Network tab
# 4. Recarregue página
# 5. Procure por erros (vermelho 4xx/5xx)
```

---

## 🧪 Checklist pré-deploy

- [ ] `npm run lint` passou?
- [ ] `npm run tsc` sem erros?
- [ ] `npm run build` sucesso?
- [ ] Preview (`npm run preview`) funciona?
- [ ] Testei fluxo crítico?
- [ ] Commit message segue Conventional Commits?
- [ ] Env vars atualizadas em Lovable?
- [ ] Branch correto (main ou develop)?

---

## 🚨 Problemas comuns

### "Build failed: Cannot find module X"

**Causa:** Dependência faltando ou import errado

**Solução:**
```bash
# 1. Verificar import
grep -r "import.*X" src/

# 2. Verificar que package.json tem X
cat package.json | grep X

# 3. Reinstalar
npm install

# 4. Tentar build novamente
npm run build
```

### "Deployment timed out"

**Causa:** Build muito lento (> 10 min)

**Solução:**
```bash
# 1. Verificar tamanho bundle
npm run build
# Se > 1MB gzipped, otimizar

# 2. Remover dependências não-utilizadas
npm prune

# 3. Fazer push novamente
git push
```

### "Env var undefined em produção"

**Causa:** Env var não configurada no Lovable

**Solução:**
```bash
# 1. Ir para Lovable painel
# 2. Environment Variables
# 3. Adicionar a var que falta
# 4. Re-deploy (manual ou via push)
```

---

## 📉 Performance Monitoring

### Métricas de build

```bash
npm run build 2>&1 | tail -20
# Mostrar tempo de build e tamanho de arquivos
```

### Esperado

- Build time: < 60 segundos
- Bundle size: < 500KB (antes de gzip)
- Gzipped: < 150KB

---

## 🔄 CD/CI (Contínuo)

### Atualmente

- ✅ Trigger: `git push` qualquer branch
- ✅ Build automático no Lovable
- ✅ Deploy automático se `main` ou `develop`

### Recomendado (Futuro)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run lint
      - run: npm run tsc
      - run: npm run build
      - run: npm test  # (quando testes forem adicionados)
```

---

## 📚 Relacionado

- **Setup Local:** [[Setup-Local.md]]
- **Variáveis de Ambiente:** [[../Arquitetura/Variáveis-de-Ambiente.md]]
- **Integrações:** [[../Arquitetura/Integrações-Externas.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29  
**Status:** Produção via Lovable + GitHub
