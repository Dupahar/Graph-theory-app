# Project Report: Graph Theory Explorer

## 1. Project Overview
**Graph Theory Explorer** is a dual-purpose web application designed to demonstrate advanced graph theory concepts through practical, interactive applications. It is divided into two major components:

1.  **Major Project (Timetable Scheduling)**: A system usually applied to university scheduling. It uses **Graph Coloring** algorithms to map courses to time slots such that no two conflicting courses share the same slot.
2.  **Minor Project (Pathfinding)**: An educational tool to visualize **Euler Paths** (visiting every edge exactly once) and **Hamiltonian Paths** (visiting every vertex exactly once).

---

## 2. Technology Stack
The application is built using a modern, scalable web stack:
-   **Framework**: [Next.js 14](https://nextjs.org/) (React) for server-side rendering and routing.
-   **Language**: [TypeScript](https://www.typescriptlang.org/) for type-safe code and robust logic.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for rapid, modern UI development.
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) for efficient, global graph state management.
-   **Visualization**: Custom SVG-based engine with **Simulated Annealing/Force-Directed** physics.
-   **Data Processing**: Python (`scripts/extract_timetable.py`) for parsing raw PDF data.

---

## 3. Methodology

### 3.1. Major Project: Automated Timetable Scheduling

#### **Problem Statement**
University scheduling is a classic **NP-Hard** problem. We model it as a **Graph Coloring Problem**, where:
-   **Vertices (Nodes)** represent Courses (or Exams).
-   **Edges** represent Conflicts (e.g., same teacher, same student group).
-   **Colors** represent Time Slots.

#### **Implementation Steps**
1.  **Data Ingestion**: 
    -   We developed a Python script (`scripts/extract_timetable.py`) to parse the official "BITS Pilani First Semester Timetable" PDF.
    -   It uses `pdfplumber` to extract table rows and `json` to serialize them into a structural format (`lib/data/timetable_default.json`).
    -   The system filters huge datasets by Department (CS, Math, etc.) to keep the graph manageable in the browser.

2.  **Constraint Modeling**:
    -   **Hard Constraints**: 
        -   **Teacher Conflict**: Two courses taught by the same instructor cannot be simultaneous.
        -   **Group Conflict**: (Optional) Courses for the same year/batch cannot clash.
    -   Based on these rules, an undirected graph is built where an edge exists if two courses conflict.

3.  **Visualization (The "Conflict Graph")**:
    -   We implemented a **Force-Directed Graph Layout** algorithm (`lib/layout-logic.ts`).
    -   **Physics Model**: Nodes repel each other (Coulomb's Law), processing connected nodes which attract (Hooke's Law).
    -   **Result**: Complex conflict clusters naturally separate, visually revealing "bottlenecks" in the schedule.

4.  **Scheduling Algorithms**:
    We implemented three distinct coloring strategies to solve the schedule:
    -   **Greedy (Welsh-Powell)**: Sorts nodes by degree (most conflicted first) and assigns the first available color. Fast but sometimes uses more slots than necessary.
    -   **DSATUR (Degree of Saturation)**: Dynamically picks the node with the most *colored* neighbors. This typically produces the most compact schedule (minimum time slots).
    -   **Balanced Allocation**: A custom heuristic that tries to use *all* available time slots (Mon-Fri, 9-5) evenly, preventing "Monday Morning overload" even if a mathematically compact schedule is possible.

5.  **Output**:
    -   The application generates a **Weekly Grid View**.
    -   **Export**: Users can download the schedule as a `.csv` file compatible with Excel.

### 3.2. Minor Project: Pathfinding Visualizer

#### **Problem Statement**
To teach the difference between:
-   **Euler Path/Circuit**: Can you draw the shape without lifting your pen? (Uses precise degree theorems).
-   **Hamiltonian Path**: Can you visit every city exactly once? (NP-Complete, uses Backtracking).

#### **Implementation Steps**
1.  **Input System**:
    -   A robust text parser (`parseGraphInput`) allows users to define graphs using various formats:
        -   Adjacency List: `A: B, C`
        -   Edge Pairs: `A, B`
        -   Visual Arrows: `A -> B -> C`
    -   This allows for rapid testing of textbook problems.

2.  **Algorithms**:
    -   **Eulerian**: Checks node degrees (All even = Circuit; Exactly 2 odd = Path). Uses **Hierholzer’s Algorithm** to find the actual trace.
    -   **Hamiltonian**: Uses a recursive **Backtracking** approach to explore all permutations.

3.  **Animation**:
    -   The system highlights the path step-by-step, coloring edges blue as they are traversed, providing immediate visual feedback.

---

## 4. File Structure & Key Components

```
/
├── app/
│   ├── major/page.tsx       # Main Timetable Scheduling Interface
│   └── minor/page.tsx       # Euler/Hamiltonian Visualizer
├── components/
│   └── GraphCanvas.tsx      # Reusable SVG Graph renderer with Drag/Pan/Zoom
├── lib/
│   ├── graph-algorithms.ts  # Core logic (Greedy, DSATUR, Euler, Backtracking)
│   ├── layout-logic.ts      # Force-Directed Physics Engine
│   └── useGraphStore.ts     # Global State (Zustand)
├── scripts/
│   └── extract_timetable.py # Data Pipeline (PDF -> JSON)
```

## 5. Current Status & Achievements
-   **Functionality**: Both Major and Minor projects are fully functional.
-   **Performance**: The layout engine has been tuned (high repulsion) to handle messy real-world graphs without overlapping.
-   **Usability**: The application supports Zoom/Pan, direct graph manipulation, and standard file exports.
-   **Real-World Data**: Successfully integrated BITS Pilani timetable data for realistic simulations.
