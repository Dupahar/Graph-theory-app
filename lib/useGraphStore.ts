import { create } from 'zustand';

export type Node = {
    id: string;
    x: number;
    y: number;
    label?: string;
    color?: string; // For coloring algorithms
};

export type Edge = {
    id: string;
    source: string;
    target: string;
    weight?: number;
    isDirected: boolean;
    color?: string; // For path visualization
    width?: number; // For path visualization
};

interface GraphState {
    nodes: Node[];
    edges: Edge[];
    isDirected: boolean;

    // Actions
    addNode: (node: Node) => void;
    updateNode: (id: string, data: Partial<Node>) => void;
    removeNode: (id: string) => void;

    addEdge: (edge: Edge) => void;
    updateEdge: (id: string, data: Partial<Edge>) => void;
    removeEdge: (id: string) => void;

    setDirected: (isDirected: boolean) => void;
    clearGraph: () => void;
    setGraph: (nodes: Node[], edges: Edge[]) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
    nodes: [],
    edges: [],
    isDirected: false,

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
    updateNode: (id, data) => set((state) => ({
        nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...data } : node)),
    })),
    removeNode: (id) => set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    })),

    addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
    updateEdge: (id, data) => set((state) => ({
        edges: state.edges.map((edge) => (edge.id === id ? { ...edge, ...data } : edge)),
    })),
    removeEdge: (id) => set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== id),
    })),

    setDirected: (isDirected) => set({ isDirected }),
    clearGraph: () => set({ nodes: [], edges: [] }),
    setGraph: (nodes, edges) => set({ nodes, edges }),
}));
