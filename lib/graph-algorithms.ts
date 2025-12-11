import { Node, Edge } from './useGraphStore';

// Adjacency List Type
type AdjacencyList = Map<string, string[]>;

export function buildAdjacencyList(nodes: Node[], edges: Edge[], isDirected: boolean): AdjacencyList {
    const adj = new Map<string, string[]>();

    nodes.forEach(node => {
        adj.set(node.id, []);
    });

    edges.forEach(edge => {
        if (adj.has(edge.source)) {
            adj.get(edge.source)?.push(edge.target);
        }

        if (!isDirected) {
            if (adj.has(edge.target)) {
                adj.get(edge.target)?.push(edge.source);
            }
        }
    });

    return adj;
}

export function getDegrees(adj: AdjacencyList, isDirected: boolean) {
    const degrees = new Map<string, { in: number, out: number }>();

    // Initialize
    for (const node of adj.keys()) {
        degrees.set(node, { in: 0, out: 0 });
    }

    for (const [node, neighbors] of adj.entries()) {
        const nodeDeg = degrees.get(node)!;
        nodeDeg.out = neighbors.length;

        neighbors.forEach(neighbor => {
            if (degrees.has(neighbor)) {
                degrees.get(neighbor)!.in++;
            }
        });
    }

    return degrees;
}

export function checkEuler(nodes: Node[], edges: Edge[], isDirected: boolean) {
    const adj = buildAdjacencyList(nodes, edges, isDirected);
    const degrees = getDegrees(adj, isDirected);

    let startNode: string | null = null;
    let endNode: string | null = null;

    if (isDirected) {
        let oddOut = 0;
        let oddIn = 0;
        let balanced = 0;

        for (const [node, deg] of degrees) {
            if (deg.out - deg.in === 1) {
                oddOut++;
                startNode = node;
            } else if (deg.in - deg.out === 1) {
                oddIn++;
                endNode = node;
            } else if (deg.in === deg.out) {
                balanced++;
            } else {
                return { hasPath: false, hasCircuit: false, message: "Degrees do not satisfy Euler conditions.", path: [] };
            }
        }

        if (oddOut === 0 && oddIn === 0) {
            // Circuit: Start anywhere (that has edges)
            const nodeWithEdges = nodes.find(n => (adj.get(n.id)?.length || 0) > 0);
            startNode = nodeWithEdges ? nodeWithEdges.id : nodes[0]?.id;

            const path = findPathHierholzer(nodes, edges, isDirected, startNode!);
            return { hasPath: true, hasCircuit: true, message: "Euler Circuit exists (All vertices balanced).", startNode, path };
        } else if (oddOut === 1 && oddIn === 1) {
            const path = findPathHierholzer(nodes, edges, isDirected, startNode!);
            return { hasPath: true, hasCircuit: false, message: "Euler Path exists.", startNode, path };
        } else {
            return { hasPath: false, hasCircuit: false, message: "No Euler Path/Circuit.", path: [] };
        }
    } else {
        let oddDegreeCount = 0;
        const oddNodes: string[] = [];

        for (const [node, deg] of degrees) {
            if (deg.out % 2 !== 0) {
                oddDegreeCount++;
                oddNodes.push(node);
            }
        }

        if (oddDegreeCount === 0) {
            // Circuit: Start anywhere (that has edges)
            const nodeWithEdges = nodes.find(n => (adj.get(n.id)?.length || 0) > 0);
            startNode = nodeWithEdges ? nodeWithEdges.id : nodes[0]?.id;

            const path = findPathHierholzer(nodes, edges, isDirected, startNode!);
            return { hasPath: true, hasCircuit: true, message: "Euler Circuit exists (All vertices even degree).", startNode, path };
        } else if (oddDegreeCount === 2) {
            const path = findPathHierholzer(nodes, edges, isDirected, oddNodes[0]);
            return { hasPath: true, hasCircuit: false, message: "Euler Path exists (2 odd vertices).", startNode: oddNodes[0], path };
        } else {
            return { hasPath: false, hasCircuit: false, message: `No Euler Path/Circuit (${oddDegreeCount} odd vertices).`, path: [] };
        }
    }
}

function findPathHierholzer(nodes: Node[], edges: Edge[], isDirected: boolean, startNode: string): string[] {
    // Deep copy edges to track used edges
    // We need to track edge IDs to handle multiple edges between same nodes correctly
    const availableEdges = new Map<string, string[]>(); // node -> [edgeId]
    const edgeMap = new Map<string, { target: string, id: string }>(); // edgeId -> {target, id}

    // Build adjacency with edge IDs
    nodes.forEach(n => availableEdges.set(n.id, []));
    edges.forEach(e => {
        availableEdges.get(e.source)?.push(e.id);
        edgeMap.set(e.id, { target: e.target, id: e.id });

        if (!isDirected) {
            // For undirected, we need to handle the reverse direction too, but track the SAME edge ID
            // We'll store it in the other node's list too
            availableEdges.get(e.target)?.push(e.id);
            // We need a way to know the "other" end given an edge ID and a start node
        }
    });

    const path: string[] = [];
    const stack: string[] = [startNode];
    const usedEdges = new Set<string>();

    while (stack.length > 0) {
        const u = stack[stack.length - 1];
        const uEdges = availableEdges.get(u) || [];

        // Find first unused edge
        let foundEdge = false;

        // We need to iterate and remove used edges efficiently
        // Since we modify the array, we check backwards or use a while loop
        while (uEdges.length > 0) {
            const edgeId = uEdges[uEdges.length - 1]; // Peek

            if (usedEdges.has(edgeId)) {
                uEdges.pop(); // Remove already used edge
                continue;
            }

            // Found unused edge
            uEdges.pop(); // Remove from list
            usedEdges.add(edgeId);

            // Find target
            let target = "";
            if (isDirected) {
                target = edgeMap.get(edgeId)!.target;
            } else {
                // For undirected, find the other end
                const e = edges.find(ed => ed.id === edgeId)!;
                target = (e.source === u) ? e.target : e.source;
            }

            stack.push(target);
            foundEdge = true;
            break;
        }

        if (!foundEdge) {
            path.push(stack.pop()!);
        }
    }

    return path.reverse();
}

export function findHamiltonianPath(nodes: Node[], edges: Edge[], isDirected: boolean) {
    const adj = buildAdjacencyList(nodes, edges, isDirected);
    const n = nodes.length;
    const path: string[] = [];
    const visited = new Set<string>();

    function backtrack(current: string): boolean {
        path.push(current);
        visited.add(current);

        if (path.length === n) {
            return true;
        }

        const neighbors = adj.get(current) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (backtrack(neighbor)) return true;
            }
        }

        visited.delete(current);
        path.pop();
        return false;
    }

    // Try starting from every node
    for (const node of nodes) {
        if (backtrack(node.id)) {
            return { hasPath: true, path, message: "Hamiltonian Path found." };
        }
    }

    return { hasPath: false, path: [], message: "No Hamiltonian Path found." };
}

export function isConnected(adj: AdjacencyList, nodes: Node[]): boolean {
    if (nodes.length === 0) return true;

    const visited = new Set<string>();
    const startNode = nodes[0].id;

    // BFS
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
        const curr = queue.shift()!;
        const neighbors = adj.get(curr) || [];

        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return visited.size === nodes.length;
}

// Project C: Graph Coloring

export function balancedColoring(nodes: Node[], edges: Edge[], maxSlots: number = 40): Map<string, number> {
    const adjList = buildAdjacencyList(nodes, edges, false);
    const sortedNodes = nodes.slice().sort((a, b) => (adjList.get(b.id)?.length || 0) - (adjList.get(a.id)?.length || 0));
    const colors = new Map<string, number>();
    const slotCounts = new Array(maxSlots + 1).fill(0); // 1-indexed

    sortedNodes.forEach(node => {
        const neighborColors = new Set<number>();
        (adjList.get(node.id) || []).forEach(neighborId => {
            if (colors.has(neighborId)) {
                neighborColors.add(colors.get(neighborId)!);
            }
        });

        // Find all VALID slots
        const validSlots: number[] = [];
        for (let c = 1; c <= maxSlots; c++) {
            if (!neighborColors.has(c)) {
                validSlots.push(c);
            }
        }

        if (validSlots.length > 0) {
            // Pick slot with LEAST current usage to balance load
            validSlots.sort((a, b) => slotCounts[a] - slotCounts[b]);
            const selectedSlot = validSlots[0];
            colors.set(node.id, selectedSlot);
            slotCounts[selectedSlot]++;
        } else {
            // Overflow if no valid slot in range (should rarely happen for 40 slots and simple graph)
            // Just pick first available above maxSlots
            let c = maxSlots + 1;
            while (neighborColors.has(c)) c++;
            colors.set(node.id, c);
        }
    });

    return colors;
}

export function greedyColoring(nodes: Node[], edges: Edge[]): { colors: Map<string, number>, maxColor: number } {
    // 1. Sort nodes by degree (descending) - Welsh-Powell heuristic
    const adj = buildAdjacencyList(nodes, edges, false);
    const sortedNodes = [...nodes].sort((a, b) => {
        const degA = adj.get(a.id)?.length || 0;
        const degB = adj.get(b.id)?.length || 0;
        return degB - degA;
    });

    const colors = new Map<string, number>();
    let maxColor = 0;

    for (const node of sortedNodes) {
        const usedColors = new Set<number>();
        const neighbors = adj.get(node.id) || [];

        for (const neighborId of neighbors) {
            if (colors.has(neighborId)) {
                usedColors.add(colors.get(neighborId)!);
            }
        }

        let color = 1;
        while (usedColors.has(color)) {
            color++;
        }

        colors.set(node.id, color);
        if (color > maxColor) maxColor = color;
    }

    return { colors, maxColor };
}

// Backtracking for exact Chromatic Number (can be slow)
export function backtrackingColoring(nodes: Node[], edges: Edge[]) {
    const adj = buildAdjacencyList(nodes, edges, false);
    const colors = new Map<string, number>();
    const n = nodes.length;
    let minColorsFound = n + 1;
    let bestColors = new Map<string, number>();

    // Optimization: Maximum degree + 1 is an upper bound
    // We can try to find if k-coloring exists for k = 1, 2, ...

    // Simple recursive check for k-coloring
    function isSafe(nodeId: string, c: number, currentColors: Map<string, number>): boolean {
        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (currentColors.get(neighbor) === c) return false;
        }
        return true;
    }

    function solve(nodeIndex: number, m: number, currentColors: Map<string, number>): boolean {
        if (nodeIndex === n) return true;

        const node = nodes[nodeIndex];
        for (let c = 1; c <= m; c++) {
            if (isSafe(node.id, c, currentColors)) {
                currentColors.set(node.id, c);
                if (solve(nodeIndex + 1, m, currentColors)) return true;
                currentColors.delete(node.id);
            }
        }
        return false;
    }

    // Try to find smallest m
    for (let m = 1; m <= n; m++) {
        const currentColors = new Map<string, number>();
        if (solve(0, m, currentColors)) {
            return { colors: currentColors, maxColor: m };
        }
    }

    return { colors: new Map(), maxColor: n };
}

export function dsaturColoring(nodes: Node[], edges: Edge[]) {
    const adj = buildAdjacencyList(nodes, edges, false);
    const n = nodes.length;
    const colors = new Map<string, number>();
    const degrees = new Map<string, number>();
    const saturation = new Map<string, Set<number>>(); // Set of colors in neighborhood

    // Initialize degrees and saturation
    nodes.forEach(node => {
        degrees.set(node.id, adj.get(node.id)?.length || 0);
        saturation.set(node.id, new Set());
    });

    const uncolored = new Set(nodes.map(n => n.id));
    let maxColor = 0;

    while (uncolored.size > 0) {
        // Select node with max saturation, then max degree
        let bestNode: string | null = null;
        let maxSat = -1;
        let maxDeg = -1;

        for (const nodeId of uncolored) {
            const sat = saturation.get(nodeId)!.size;
            const deg = degrees.get(nodeId)!;

            if (sat > maxSat) {
                maxSat = sat;
                maxDeg = deg;
                bestNode = nodeId;
            } else if (sat === maxSat) {
                if (deg > maxDeg) {
                    maxDeg = deg;
                    bestNode = nodeId;
                }
            }
        }

        if (!bestNode) break; // Should not happen

        // Color the best node
        const neighbors = adj.get(bestNode) || [];
        const usedColors = new Set<number>();

        neighbors.forEach(neighbor => {
            if (colors.has(neighbor)) {
                usedColors.add(colors.get(neighbor)!);
            }
        });

        let color = 1;
        while (usedColors.has(color)) {
            color++;
        }

        colors.set(bestNode, color);
        if (color > maxColor) maxColor = color;
        uncolored.delete(bestNode);

        // Update saturation of neighbors
        neighbors.forEach(neighbor => {
            if (uncolored.has(neighbor)) {
                saturation.get(neighbor)!.add(color);
            }
        });
    }

    return { colors, maxColor };
}
