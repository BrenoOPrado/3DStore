# Cobertura de requisitos × implementação × Cypress

Adaptado do DRS de livros para peças 3D. IDs oficiais do DRS.

| Grupo | Requisitos | Onde | Spec Cypress |
| --- | --- | --- | --- |
| Clientes | RF0021–RF0025, RN0021–RN0023, RN0026–RN0027, RNF0031–RNF0035 | Cadastro, conta, admin clientes | 01–04 |
| Endereços | RF0026, RNF0034 | Conta → Endereços | 05 |
| Cartões | RF0027, RN0024–RN0025 | Conta → Cartões | 06 |
| Senha | RF0028, RNF0031–RNF0032 | Conta → Senha | 07 |
| Carrinho / compra | RF0031–RF0038, RN0031, RN0033–RN0036 | Carrinho, checkout | 08 |
| Ciclo / estoque / troca | RF0039+, despacho, ENTREGUE, troca, cupom | Admin pedidos + conta | 09 |
| Análise gráfica | vendas ENTREGUE por categoria/período, RNF0011 | Admin gráfico (Recharts) | 10 |
| Produtos | RF0011–RF0016 (adapt.), soft-delete, preço >10% | Admin produtos | 11 |
| Chat / IA | **RNF0044** (Gemini + ajuste fino + feedback) | FAB chat + Admin IA | 12 |
| Transversais | RNF0012 (logs), sessão cookie | API / auditoria | coberto nos fluxos |

## Cenários RNF0044 (apresentação)

1. Integração Gemini — Admin → IA (`ai-llm-status`)  
2–3. Personalização Ana ≠ Carla — `12-chatbot`  
4–6. Busca / dúvida / sugestão — `12-chatbot` (busca + dúvida)  
7. Útil / não útil — `12-chatbot`  
8. Retreino — Admin → Retreinar agora  

## Como rodar

```bash
npm run dev
npx cypress run
```
