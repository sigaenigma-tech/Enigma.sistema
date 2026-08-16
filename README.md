# ENIGMA · Sistema (PDV + OS + Estoque)

## Como publicar (Vercel)

1. Crie um repositório novo no GitHub (pode ser privado) e suba todos os
   arquivos desta pasta nele.
2. Entre em vercel.com, clique em **Add New Project**, conecte sua conta
   do GitHub e selecione esse repositório.
3. A Vercel detecta automaticamente que é um projeto Vite — não precisa
   mudar nenhuma configuração. Clique em **Deploy**.
4. Em menos de um minuto você recebe um link tipo
   `https://enigma-sistema.vercel.app`, já funcionando.

## Como testar localmente antes de publicar (opcional)

Se quiser rodar no seu computador antes de publicar:

```
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Banco de dados

O sistema já está conectado ao Supabase do projeto Enigma
(URL e chave pública estão dentro de `src/App.jsx`). Não precisa
configurar nada a mais — é só publicar.

## Próximos passos possíveis

- Adicionar login (Supabase Auth) para restringir o acesso
- Mover as fotos das OS para o Supabase Storage (hoje ficam
  guardadas junto com o registro da OS)
- Domínio próprio (ex: sistema.enigma.com.br) apontado na Vercel
