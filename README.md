# Exam & Class Timetable Scheduler

A "Major Project" standard application for automated timetable scheduling using Graph Coloring algorithms.

## Features

### 1. Advanced Graph Visualization
- **Force-Directed Layout**: Visualizes course conflicts using a physics-based simulation where conflicting nodes repel and connected nodes attract.
- **Interactive Canvas**: Supports Pan, Zoom, and Dragging of nodes.

### 2. Intelligent Scheduling Algorithms
- **Balanced Distribution**: Distributes courses evenly across the week (Mon-Fri, 8 AM - 5 PM) to prevent "crowding" in early slots.
- **Deep Conflict Resolution**: Handling of "Same Teacher", "Same Student Group", and "Year-Group" hard constraints.

### 3. Professional Timetable Generation
- **Aggregated Views**: Automatically groups identical course sections (e.g., "Math 101 (5 sections)") into single, readable blocks.
- **Grid Layout**: Displays a clear Weekly Grid view (Time vs Day).

### 4. Data Export
- **CSV Export**: Download the generated schedule as a formatted CSV file for Excel/Google Sheets.
- **Graph Export**: (Experimental) functionality to save the conflict graph visualization.

## Tech Stack
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Algorithms**: Greedy Welsh-Powell, DSATUR, Balanced Slot Allocation.

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000/major](http://localhost:3000/major) to view the application.

## Usage
1. **Input Data**: Add courses manually or load pre-set "BITS Pilani" department data.
2. **Generate Graph**: Click "Conflict Graph" to see the visual connections.
3. **Schedule**: Click "Generate Schedule" to run the coloring algorithm.
4. **Export**: Use the "Export CSV" button in the Timetable view to save your schedule.
