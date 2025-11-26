# Graph Theory & Timetable Scheduling App

An interactive web application demonstrating advanced Graph Theory concepts, built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

**Live Demo:** [https://graph-theory-app.vercel.app/](https://graph-theory-app.vercel.app/)


## 🚀 Features

### 1. Euler & Hamiltonian Paths (Project B)
Visualize fundamental graph traversal algorithms with an interactive canvas.
*   **Interactive Graph Creation**: Add nodes and edges, drag to rearrange.
*   **Text Input**: Quickly generate graphs by pasting edge lists (e.g., `A,B`).
*   **Euler Path/Circuit**: Detects existence and **animates** the path using Hierholzer's Algorithm.
*   **Hamiltonian Path**: Finds and animates paths visiting every vertex exactly once.

### 2. Timetable Scheduling (Project C)
Solve complex scheduling problems using Graph Coloring.
*   **Dual Modes**:
    *   **Class Schedule**: Avoid conflicts between Teachers and Student Groups.
    *   **Exam Schedule**: Prevent exams from the same Semester occurring simultaneously.
*   **Algorithms**: Compare **Greedy (Welsh-Powell)** vs. **DSATUR** (Degree of Saturation) coloring algorithms.
*   **Visualizations**: View the Conflict Graph and the resulting Color-Coded Timetable.

## 🛠️ Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: Zustand
*   **Animations**: Framer Motion
*   **Icons**: Lucide React

## 📦 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/graph-theory-app.git
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Run the development server**
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
