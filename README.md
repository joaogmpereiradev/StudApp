# 🎓 StudApp - Alta Performance nos Estudos

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-indigo?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-React_19_|_Vite_|_Firebase-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Powered_by_Gemini-8E75B2?style=for-the-badge)

> **StudApp** é uma aplicação web progressiva (PWA) projetada para estudantes que desejam organizar suas rotinas com Inteligência Artificial e dominar o método de **Repetição Espaçada** para maximizar a retenção de aprendizado.

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
- **Modo Offline:** Funciona mesmo sem internet (PWA com cache inteligente do Firestore).

### 🎨 UI/UX Moderna
- **Dark Mode Nativo:** Interface elegante e confortável para estudos noturnos.
- **Responsivo:** Funciona perfeitamente em Desktop e Mobile.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite.
- **Estilização:** Tailwind CSS (com animações customizadas).
- **Backend & Auth:** Firebase (Firestore, Authentication).
- **Inteligência Artificial:** Google GenAI SDK (Gemini 3 Flash).
- **Utilitários:** XLSX (SheetJS), FontAwesome.

---

## 📱 PWA (Progressive Web App)

Este projeto possui configuração de Service Worker (`sw.js`) e Manifesto (`manifest.json`), permitindo que seja instalado como um aplicativo nativo no Android, iOS e Desktop.

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaFeature`)
3. Faça o Commit (`git commit -m 'Add: Minha nova feature'`)
4. Faça o Push (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Distribuído sob a licença MIT.

---

Desenvolvido com 💜 para estudantes de alta performance.