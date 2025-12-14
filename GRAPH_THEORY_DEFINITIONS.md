# Graph Theory Concepts & Definitions Report

This document outlines the mathematical definitions and graph theory concepts utilized in the **Graph Theory Explorer** project.

## 1. Fundamental Definitions

### **Graph ($G$)**
A mathematical structure consisting of a set of **Vertices ($V$)** (or nodes) and a set of **Edges ($E$)** that connect pairs of vertices.
-   **In our project**: Vertices represent courses (Major) or generic points (Minor). Edges represent relationships (conflicts or paths).

### **Adjacency**
Two vertices are "adjacent" if they are connected by an edge.
-   **In our project**: Two courses are adjacent if they cannot be scheduled at the same time.

### **Degree ($deg(v)$)**
The number of edges connected to a vertex $v$.
-   **Significance**: High-degree nodes (courses with many conflicts) are harder to schedule and are processed first in our algorithms.

---

## 2. Scheduling Concepts (Major Project)

### **Conflict Graph**
A specialized graph model used for resource allocation problems.
-   **Definition**: A graph where every vertex represents a task (e.g., a University Course), and an edge connects two vertices if the tasks typically cannot be performed simultaneously.
-   **Application**: In our app, an edge exists between "Math 101" and "Physics 101" if:
    1.  They share the same **Professor**.
    2.  They share the same **Student Group** (e.g., 1st Year Students).

### **Graph Coloring**
The assignment of labels (called "colors") to elements of a graph subject to certain constraints.
-   **Vertex Coloring**: Assigning a color to each vertex such that no two adjacent vertices share the same color.
-   **Application**:
    -   **Color** = Time Slot (e.g., Monday 9 AM).
    -   **Constraint**: If "Math" and "Physics" are connected (conflict), they must have different colors (Time Slots).

### **Chromatic Number ($\chi(G)$)**
The smallest number of colors needed to color a graph $G$.
-   **Significance**: This represents the **minimum number of time slots** required to schedule all classes without conflict.

### **Algorithms Used**
1.  **Welsh-Powell (Greedy)**: Orders vertices by descending degree (hardest to color first) and assigns the first available color.
2.  **DSATUR (Degree of Saturation)**: A heuristic that prioritizes vertices with the largest number of *differently colored* neighbors. It is generally more efficient than simple greedy approaches for finding a value close to $\chi(G)$.

---

## 3. Pathfinding Concepts (Minor Project)

### **Euler Path & Circuit**
-   **Euler Path**: A trail in a graph which visits every **edge** exactly once.
-   **Euler Circuit**: An Euler path that starts and ends on the same vertex.
-   **Condition**: A connected graph has an Euler Circuit if and only if every vertex has an **even degree**.
-   **Application**: Used in route planning (e.g., Garbage collection trucks, Mail delivery).

### **Hamiltonian Path & Circuit**
-   **Hamiltonian Path**: A path in a graph that visits every **vertex** exactly once.
-   **Connection to Scheduling**: It is an NP-complete problem. Unlike Euler paths (easy to find), finding a Hamiltonian path is computationally difficult.
-   **Application**: Traveling Salesman Problem (TSP).

---

## 4. Visualization Concepts

### **Force-Directed Layout**
A generic class of algorithms for drawing graphs in an aesthetically pleasing way.
-   **Principle**: The graph is simulated as a physical system.
    -   **Repulsion**: Vertices behave like charged particles and repel each other (Coulomb's Law).
    -   **Attraction**: Edges behave like springs and attract connected vertices (Hooke's Law).
-   **Result**: The system settles into a state where connected nodes are close, and disconnected nodes are pushed apart, minimizing edge crossings.
