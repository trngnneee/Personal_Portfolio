# 🌐 Personal Portfolio

A simple and clean personal portfolio built with **React + Vite**.  
It includes basic sections like **About**, **Projects**, and **Contact**, and can be easily customized to showcase your profile.

---

## 🚀 Features

- ⚡ Built with [Vite](https://vitejs.dev/) for fast development and builds
- ⚛️ Powered by [React](https://react.dev/)
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/)
- 🔥 Hot Module Replacement (HMR) enabled

---

## 🛠️ Installation & Setup

1. **Clone this repository**

```bash
git clone https://github.com/your-username/personal-portfolio.git
cd personal-portfolio
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the project locally**

```bash
npm run dev
```

4. **Open in browser**

```sh
http://localhost:5173
```

---

## 📁 Project Structure

```ini
personal-portfolio/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── sections/          # About, Projects, Contact sections
│   ├── App.jsx            # Main App component
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind styles
├── .eslintrc.cjs          # ESLint configuration
├── index.html             # HTML template
├── package.json           # Project dependencies
└── vite.config.js         # Vite configuration
```

---

## 🧑‍💻 Customization

- Update your **name**, **bio**, and **project details** in the `src/sections/` folder.

- Modify styles in `index.css` or add your own Tailwind utilities.

- To deploy, you can use:

```bash
npm run build
```

---

## 🧩 Tech Stack

- **React** – UI Library
- **Vite** – Build Tool
- **Tailwind CSS** – Styling
- **ESLint** – Code Linting

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

### 💡 Author

**Truong Nguyen**  
Frontend Developer ✨  
📧 [dtn06052005@gmail.com](mailto:dtn06052005@gmail.com)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
