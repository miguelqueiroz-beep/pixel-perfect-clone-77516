# 🔗 Integrações Externas

Serviços third-party, APIs, webhooks e contratos de integração.

---

## 🌐 Supabase (Database + Auth + Realtime)

**Função:** Backend-as-a-Service completo (BD, auth, realtime).

**Contrato:**

### URLs e Chaves
- **URL:** `https://jtpizybfydlhxbpjenry.supabase.co` (do `supabase/config.toml`)
- **Publishable Key:** `VITE_SUPABASE_PUBLISHABLE_KEY` (client-side)
- **Secret Key:** `SUPABASE_PUBLISHABLE_KEY` (server-side, **NUNCA expor**)

### Recursos utilizados

#### 1. **Auth (Email + Password)**
- Signup: `supabase.auth.signUp({ email, password })`
- Login: `supabase.auth.signInWithPassword({ email, password })`
- Logout: `supabase.auth.signOut()`
- Get user: `supabase.auth.getUser()`
- JWT refresh automático (localStorage persistence)

**Endpoints:**
- `POST /auth/v1/signup` — Criar conta
- `POST /auth/v1/token?grant_type=password` — Login
- `POST /auth/v1/logout` — Logout
- `GET /auth/v1/user` — Dados do usuário (com JWT)

**Token:** JWT com claim `sub = user.id`

#### 2. **PostgreSQL + RLS**
- 7 tabelas: `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `goals`, `auth.users`
- Postgrest API: `https://jtpizybfydlhxbpjenry.supabase.co/rest/v1/`
- Row-level security: políticas que filtram por `auth.uid()`

**Operações:**
```javascript
// SELECT
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);

// INSERT
const { data, error } = await supabase
  .from('transactions')
  .insert([{ user_id, amount, date, ... }]);

// UPDATE
const { data, error } = await supabase
  .from('transactions')
  .update({ amount: 100 })
  .eq('id', transactionId);

// DELETE
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId);
```

#### 3. **Realtime (WebSocket)**
- Subscribe a mudanças em tempo real
- Filtros por tipo de evento (INSERT, UPDATE, DELETE)

```javascript
supabase
  .channel(`transactions:${userId}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'transactions' },
    (payload) => { console.log('Nova transação:', payload); }
  )
  .subscribe();
```

**⚠️ Nota:** React Query já integra Realtime em alguns casos.

### Rate Limiting
- **Auth:** 30 req/min por IP
- **Postgrest:** 1000 req/min por projeto (default)
- **Real time:** 200 conexões simultâneas

### SLA
- Uptime: 99.9%
- Backups automáticos diários

---

## 🎨 Lovable Cloud (Deploy)

**Função:** Plataforma de deploy + ambiente de desenvolvimento.

**Como funciona:**

1. Commit em `main` → GitHub webhook
2. Lovable recebe evento, clona repo
3. Executa `npm run build`
4. Deploy para Cloudflare Workers (SSR)
5. Assets para CDN

**Variáveis de ambiente:**
- Definidas no painel Lovable
- Injetadas automaticamente em build time
- `VITE_*` acessível em client
- Sem prefix → server-only

**Exemplo:**
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_URL=https://...
SUPABASE_SECRET_KEY=eyJ...
```

**Staging/Production:**
- ⚠️ A confirmar se há staging branch dedicada (develop?)
- Main = production

**Rollback:**
- Manual: clicar "Rollback" no painel Lovable
- Automático: não há (recomenda-se deploy reverso em main)

**Logs:**
- Disponíveis no painel Lovable
- Stream de stdout/stderr

**❌ Evitar:**
- Force-push em main (reescreve histórico no Lovable)
- Secrets em .env.local (comitar vai expor)

---

## 🔊 Lovable Error Reporting

**Função:** Captura e envia erros para Lovable Cloud (observabilidade).

**Arquivo:** [src/lib/lovable-error-reporting.ts](../src/lib/lovable-error-reporting.ts)

**Uso:**
```typescript
try {
  // código
} catch (error) {
  reportLovableError(error, { context: 'transaction creation' });
}
```

**O que é capturado:**
- Stack trace
- Mensagem de erro
- Contexto (chave-valor livre)
- User agent, URL, timestamp

**Retenção:** Típica 30 dias

**Alertas:** Configurável no painel Lovable

---

## 📊 Recharts (Gráficos)

**Função:** Visualizar receita vs despesa, saldo ao longo do tempo, etc.

**Componentes usados:**
- `BarChart` — Receita/Despesa por mês
- `LineChart` — Saldo ao longo do tempo
- `PieChart` — Distribuição de despesas por categoria (futuro)
- `AreaChart` — Fluxo acumulado

**Exemplo:**
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { month: 'Jan', income: 3000, expense: 2000 },
  { month: 'Feb', income: 3500, expense: 2200 },
];

<BarChart data={data} width={500} height={300}>
  <CartesianGrid />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="income" fill="#10B981" />
  <Bar dataKey="expense" fill="#EF4444" />
</BarChart>
```

**Customização:**
- Cores no tema (Tailwind)
- Responsiveness (60% width é padrão)

---

## 📬 Notificações (Planejado)

**Status:** Feature `notifications_enabled` em `profiles`, mas sem implementação.

**Possibilidades futuras:**
- Email alerts quando orçamento ultrapassado
- Push notifications (PWA)
- In-app notifications (Sonner toast)

**Requisitos:**
- Tabela `notifications` (id, user_id, message, type, read_at)
- Worker/Cron job que dispara alerts
- Integração com email service (SendGrid, Mailgun, etc.)

---

## 💳 Pagamentos (Futuro)

**Status:** Não implementado.

**Possibilidades:**
- Stripe para premium features
- Plano gratuito vs paid
- Integrações com contas reais (Open Banking - Plaid API)

**Se implementar:**
- Adicionar `subscription_status` em profiles
- Webhook de Stripe para confirmar pagamento
- Validar status em rutas protegidas

---

## 🔐 Autenticação Social (Futuro)

**Status:** Apenas email + password por enquanto.

**Se implementar (Supabase Auth já suporta):**
- Google OAuth
- GitHub OAuth
- Microsoft/Apple (opcional)

**Mudança necessária:**
- Frontend: adicionar botões "Sign in with Google"
- Supabase: ativar providers no painel
- Backend: nenhuma mudança (Supabase gerencia)

---

## 📋 Checklist de Integração

### ✅ Já implementado
- [x] Supabase Auth (email + password)
- [x] Supabase Postgrest (CRUD)
- [x] Supabase RLS (row-level security)
- [x] Supabase Realtime (websocket)
- [x] Lovable Deploy (GitHub webhook)
- [x] Lovable Error Reporting
- [x] Recharts (gráficos básicos)

### 🔲 Planejado
- [ ] Notificações por email
- [ ] Integração com conta bancária (Open Banking)
- [ ] Pagamentos (Stripe)
- [ ] Autenticação social (Google, GitHub)
- [ ] PWA (Progressive Web App)
- [ ] Backup automático + export CSV

---

## 🚨 Problemas conhecidos

| # | Problema | Status |
|-|----------|--------|
| 1 | Rate limiting Supabase pode afetar durante picos | Monitorar |
| 2 | Force-push quebra histórico no Lovable | Evitar |
| 3 | Secrets em .env.local expostos se commitar | Educação |
| 4 | Realtime pode desconectar se offline (cliente deve reconectar) | Normal |
| 5 | Erro de Lovable reporting se app sem internet | Falha silenciosa OK |

---

## 📚 Relacionado

- **Banco de Dados:** [[Banco-de-Dados.md]]
- **Variáveis de Ambiente:** [[Variáveis-de-Ambiente.md]]
- **Setup Local:** [[../Operacao/Setup-Local.md]]
- **Deploy:** [[../Operacao/Deploy.md]]

---

**Versão:** 1.0  
**Última atualização:** 2026-06-29
