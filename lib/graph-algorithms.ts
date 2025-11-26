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

                // For directed graphs, this checks weak connectivity if we treat edges as undirected
                // But for Euler, we often need strong connectivity or specific component checks.
                // For now, simple connectivity check.

                // Check if all non-zero degree nodes are visited
                // (Isolated nodes don't affect Euler path existence if they have degree 0, usually)
                // But strictly, a graph is connected if...

                return visited.size === nodes.length; // Simplified
            }

            // Project C: Graph Coloring

            export function greedyColoring(nodes: Node[], edges: Edge[]) {
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
