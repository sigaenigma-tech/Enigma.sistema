# ENIGMA OS V2 — versão estrutural

Esta versão preserva o banco e as rotinas já existentes e reorganiza a experiência do sistema sem exigir migração imediata do Supabase.

## O que mudou

- Dashboard como tela inicial.
- Navegação ampliada: Dashboard, Atendimento, OS, PDV, Clientes, Estoque, Financeiro, Relatórios e Configurações.
- Sidebar para desktop e navegação operacional para mobile.
- Dashboard com vendas do caixa, OS em andamento, aprovações pendentes, aparelhos prontos e estoque crítico.
- Tela de Atendimento com busca rápida por cliente, telefone, aparelho ou número da OS.
- Tela de Clientes derivada do histórico atual de ordens de serviço.
- Caixa reposicionado como Financeiro.
- Base visual modernizada, mantendo identidade escura, roxo e azul da ENIGMA.

## Compatibilidade

A V2 continua usando as tabelas atuais do Supabase e não exige SQL novo para funcionar.

## Próxima etapa recomendada

1. Separar o App.jsx em módulos/componentes menores.
2. Criar autenticação real e permissões com Supabase Auth + RLS.
3. Criar tabelas independentes de clientes, empresas/unidades, itens de OS, movimentações e auditoria.
4. Migrar fotos de OS para Supabase Storage.
5. Remover PIN de edição do front-end e colocar ações administrativas sob autenticação.
6. Criar configuração de empresa e preparar multiempresa/multiunidade.
