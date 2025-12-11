import { Node, Edge } from './useGraphStore';

/**
 * Runs a force-directed simulation to position nodes.
 * @param nodes Initial nodes
 * @param edges Edges connecting nodes
 * @param width Canvas width
 * @param height Canvas height
 * @param iterations Number of simulation steps (higher = more settled)
 */
export function forceDirectedLayout(nodes: Node[], edges: Edge[], width: number = 800, height: number = 600, iterations: number = 300): Node[] {
    // Clone nodes to avoid mutating original state before ready
    const simulationNodes = nodes.map(n => ({ ...n, vx: 0, vy: 0 }));

    // Constants
    const REPULSION = 2000;
    const SPRING_LENGTH = 100;
    const SPRING_STRENGTH = 0.05;
    const DAMPING = 0.9;
    const CENTER_PULL = 0.02;

    for (let i = 0; i < iterations; i++) {
        // 1. Repulsion (Nodes push apart)
        for (let j = 0; j < simulationNodes.length; j++) {
            for (let k = j + 1; k < simulationNodes.length; k++) {
                const n1 = simulationNodes[j];
                const n2 = simulationNodes[k];

                let dx = n1.x - n2.x;
                let dy = n1.y - n2.y;
                let distSq = dx * dx + dy * dy;

                // Avoid singularity
                if (distSq < 0.1) {
                    dx = Math.random() - 0.5;
                    dy = Math.random() - 0.5;
                    distSq = dx * dx + dy * dy;
                }

                const force = REPULSION / distSq;
                const dist = Math.sqrt(distSq);

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                n1.vx += fx;
                n1.vy += fy;
                n2.vx -= fx;
                n2.vy -= fy;
            }
        }

        // 2. Attraction (Edges pull together)
        edges.forEach(edge => {
            const source = simulationNodes.find(n => n.id === edge.source);
            const target = simulationNodes.find(n => n.id === edge.target);

            if (source && target) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Hooke's Law: F = k * (current_length - target_length)
                // We want edges to be around SPRING_LENGTH
                const displacement = dist - SPRING_LENGTH;
                const force = displacement * SPRING_STRENGTH;

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }
        });

        // 3. Center Gravity (Keep in view)
        const cx = width / 2;
        const cy = height / 2;
        simulationNodes.forEach(node => {
            node.vx += (cx - node.x) * CENTER_PULL;
            node.vy += (cy - node.y) * CENTER_PULL;

            // Apply Velocity
            node.x += node.vx;
            node.y += node.vy;

            // Damping (Friction)
            node.vx *= DAMPING;
            node.vy *= DAMPING;
        });
    }

    return simulationNodes;
}
