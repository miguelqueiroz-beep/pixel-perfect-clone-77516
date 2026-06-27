Crie um PRD para um sistema que eu quero desenvolver.

antes leia a documentação do Lovable, pois vou utilizar ele para executar o PRD então a stack precisa estar de acordo com a que o lovable utiliza.

Para deploy vou utilizar o próprio lovable e para o banco de dados vou utilizar o supabase.

O sistema que eu quero desenvolver é:

Um sistema web de gestão financeira pessoal chamado **FinFlow**, desenvolvido para ajudar usuários a controlar suas receitas, despesas, metas financeiras e orçamento mensal de forma simples, moderna, intuitiva e altamente visual.

Quero que o PRD seja extremamente detalhado, descrevendo toda a lógica de negócio do sistema antes de pensar na implementação técnica.

O documento deve conter:

* Objetivo do produto.
* Problema que o sistema resolve.
* Público-alvo.
* Personas.
* Casos de uso.
* Regras de negócio.
* Fluxos completos do usuário.
* Fluxos alternativos.
* Estrutura das telas.
* Funcionalidades obrigatórias.
* Funcionalidades futuras.
* Estrutura do banco de dados no Supabase.
* Relacionamentos entre tabelas.
* Políticas de segurança (RLS).
* Fluxo de autenticação.
* Estrutura de permissões.
* Componentes reutilizáveis.
* Arquitetura recomendada pelo Lovable.
* Organização de pastas.
* Stack utilizada.
* Cronograma de desenvolvimento dividido por etapas.

Além disso, quero que cada funcionalidade contenha:

* Objetivo da funcionalidade.
* Justificativa de negócio.
* Fluxo completo de utilização.
* Validações necessárias.
* Regras de negócio.
* Estados possíveis da interface.
* Tratamento de erros.
* Mensagens exibidas ao usuário.
* Critérios de aceitação.
* Casos extremos (edge cases).
* Possíveis melhorias futuras.

---

# Objetivo do sistema

O sistema deverá funcionar como uma plataforma completa de gestão financeira pessoal, permitindo que qualquer usuário acompanhe sua vida financeira de maneira organizada e visual.

O principal objetivo é fornecer uma visão clara da situação financeira do usuário, permitindo identificar padrões de consumo, controlar gastos, acompanhar receitas, criar metas financeiras e auxiliar na tomada de decisões.

Todo o sistema deverá ser construído pensando na simplicidade para usuários iniciantes, mas com recursos suficientes para atender usuários avançados.

---

# Fluxo inicial

O usuário cria uma conta utilizando e-mail e senha.

Após confirmar seu cadastro, realiza login.

No primeiro acesso, será apresentado um processo de onboarding composto por várias etapas.

Nesse onboarding o usuário deverá informar:

* Nome.
* Foto (opcional).
* Moeda utilizada.
* Salário ou renda principal.
* Outras fontes de renda (opcional).
* Dia de recebimento do salário.
* Objetivos financeiros.
* Valor aproximado de despesas mensais.
* Se deseja utilizar orçamento mensal.
* Se deseja receber notificações.

Após concluir esse processo, o sistema deverá gerar automaticamente o dashboard inicial.

---

# Cadastro de receitas

O usuário poderá cadastrar receitas de forma manual.

Cada receita deverá possuir:

* Valor.
* Categoria.
* Conta de destino.
* Data.
* Descrição.
* Tipo de receita.
* Recorrência.
* Observações.
* Tags.

Tipos de receita incluem:

* Salário.
* Freelance.
* Investimentos.
* Venda.
* Presente.
* Reembolso.
* Dividendos.
* Outros.

Receitas recorrentes deverão ser recriadas automaticamente conforme sua periodicidade.

O usuário poderá editar, excluir, duplicar e arquivar qualquer receita.

---

# Cadastro de despesas

O usuário poderá cadastrar despesas manualmente.

Cada despesa deverá conter:

* Valor.
* Categoria.
* Forma de pagamento.
* Data.
* Conta utilizada.
* Parcelamento.
* Número da parcela.
* Total de parcelas.
* Descrição.
* Tags.
* Recorrência.
* Observações.

O sistema deverá calcular automaticamente:

* Total pago.
* Parcelas restantes.
* Valor comprometido nos próximos meses.

Categorias padrão incluem:

* Alimentação.
* Mercado.
* Transporte.
* Combustível.
* Saúde.
* Educação.
* Moradia.
* Energia.
* Água.
* Internet.
* Lazer.
* Assinaturas.
* Academia.
* Investimentos.
* Impostos.
* Outros.

O usuário poderá criar categorias próprias.

---

# Dashboard

O dashboard será a principal tela do sistema.

Deverá apresentar automaticamente:

* Saldo atual.
* Receita total do mês.
* Despesas totais.
* Economia mensal.
* Economia anual.
* Comparativo com o mês anterior.
* Comparativo com o mesmo período do ano anterior.
* Evolução patrimonial.
* Gastos por categoria.
* Receitas por categoria.
* Evolução diária do saldo.
* Últimas movimentações.
* Próximos vencimentos.
* Metas financeiras.
* Alertas.
* Indicadores rápidos.

Todos os dados deverão ser atualizados em tempo real sempre que qualquer movimentação for criada, editada ou excluída.

---

# Metas financeiras

O usuário poderá criar metas financeiras.

Cada meta possuirá:

* Nome.
* Valor alvo.
* Valor já economizado.
* Prazo.
* Prioridade.
* Categoria.
* Cor personalizada.
* Ícone.

O sistema deverá calcular automaticamente:

* Percentual concluído.
* Valor restante.
* Tempo restante.
* Valor necessário economizar por mês.
* Probabilidade de atingir a meta no prazo.

Quando uma meta for concluída, ela será arquivada automaticamente.

---

# Orçamentos

O usuário poderá criar orçamentos gerais ou específicos para categorias.

Exemplos:

* Alimentação.
* Transporte.
* Lazer.

O sistema deverá acompanhar continuamente o consumo.

Quando atingir:

* 50%
* 75%
* 90%
* 100%

o sistema deverá gerar notificações.

Caso ultrapasse o orçamento, deverá informar quanto foi excedido.

---

# Relatórios

O sistema deverá possuir relatórios completos.

Permitir visualizar:

* Diário.
* Semanal.
* Mensal.
* Trimestral.
* Semestral.
* Anual.
* Período personalizado.

Os relatórios deverão conter:

* Gráficos.
* Comparativos.
* Indicadores.
* Ranking de categorias.
* Evolução financeira.
* Receita × Despesa.
* Média diária.
* Média mensal.

Também deverão ser exportáveis em PDF e CSV.

---

# Pesquisa e filtros

O sistema deverá permitir pesquisar qualquer movimentação utilizando:

* Categoria.
* Valor.
* Intervalo de datas.
* Conta.
* Tipo.
* Forma de pagamento.
* Texto.
* Tags.
* Recorrência.
* Situação.

Os filtros poderão ser combinados.

---

# Notificações

O sistema deverá possuir um centro de notificações.

Eventos:

* Meta atingida.
* Meta próxima.
* Orçamento excedido.
* Receita recorrente criada.
* Despesa recorrente criada.
* Vencimentos próximos.
* Atualizações do sistema.

---

# Insights inteligentes

Mesmo sem utilizar IA inicialmente, o sistema deverá gerar análises automaticamente.

Exemplos:

* Categoria que mais consumiu dinheiro.
* Categoria que mais cresceu.
* Categoria que reduziu gastos.
* Média diária de despesas.
* Dias com maior gasto.
* Melhor mês do ano.
* Projeção de saldo até o fim do mês.
* Economia potencial.
* Assinaturas recorrentes.
* Gastos incomuns.

Toda essa estrutura deverá ser preparada para futura integração com modelos de IA (OpenAI, Gemini ou similares), permitindo que um assistente financeiro forneça recomendações personalizadas ao usuário.

---

Quero que o PRD seja escrito como um documento profissional utilizado por uma equipe de desenvolvimento de software, contendo todas as regras de negócio, validações, diagramas sugeridos, entidades do banco de dados, fluxos completos, requisitos funcionais, requisitos não funcionais, critérios de aceitação, backlog priorizado, roadmap e todas as decisões necessárias para que o sistema possa ser desenvolvido sem ambiguidades. Não economize detalhes e, quando houver decisões de arquitetura ou modelagem, escolha a alternativa mais escalável e alinhada às boas práticas do Lovable e do Supabase.

