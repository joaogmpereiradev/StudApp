# 🎓 StudApp - Alta Performance nos Estudos

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-indigo)
![Tech](https://img.shields.io/badge/Stack-React_19_|_Vite_|_Firebase-blue)
![AI](https://img.shields.io/badge/AI-Powered_by_Gemini-8E75B2)

> **StudApp** é uma aplicação web progressiva (PWA) projetada para estudantes que desejam organizar suas rotinas e dominar o método de **Repetição Espaçada** para maximizar a retenção de aprendizado.

---

## ✨ Funcionalidades Principais

### 🧠 Organização Inteligente (AI Powered)
- **Geração de Rotina com IA:** Utilize o **Google Gemini** para criar cronogramas de estudo baseados em seus objetivos.
- **Comandos de Voz:** Fale o que você precisa fazer e a IA organiza seu dia.
- **Edição Flexível:** Ajuste horários, ícones e cores para personalizar sua rotina (Semana vs. Fim de Semana).

### 📅 Sistema de Repetição Espaçada
- **Automação de Revisões:** Ao registrar uma aula, o app agenda automaticamente revisões para **1, 7, 30 e 90 dias** depois.
- **Dashboard de Controle:** Visualize o que precisa ser revisado hoje, o que está atrasado e o que já foi concluído.
- **Filtros Avançados:** Busque por matéria, assunto ou status da revisão.

### 🔒 Segurança e Dados
- **Autenticação Híbrida:** Login via E-mail/Senha ou Google.
- **Backup Local:** Exporte todos os seus dados (Rotinas e Revisões) para planilhas **Excel (.xlsx)**.
- **Modo Offline:** Funciona mesmo sem internet (PWA com cache inteligente).

### 🎨 UI/UX Moderna
- **Dark Mode Nativo:** Interface elegante e confortável para estudos noturnos.
- **Responsivo:** Funciona perfeitamente em Desktop e Mobile.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite.
- **Estilização:** Tailwind CSS (com animações customizadas).
- **Backend & Auth:** Firebase (Firestore, Authentication).
- **Inteligência Artificial:** Google GenAI SDK (Gemini 3 Flash/Pro).
- **Utilitários:** XLSX (SheetJS), FontAwesome.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* Node.js instalado.
* Uma conta no Google AI Studio para obter a API Key.

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/studapp.git
   cd studapp
