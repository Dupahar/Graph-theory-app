"use client";

import GraphCanvas from '@/components/GraphCanvas';
import { useGraphStore } from '@/lib/useGraphStore';
import { checkEuler, findHamiltonianPath } from '@/lib/graph-algorithms';
import { useState, useEffect } from 'react';

export default function MinorProject() {
    const { nodes, edges, isDirected, setDirected, clearGraph, updateEdge, updateNode, setGraph } = useGraphStore();
    const [result, setResult] = useState<string>("");
    const [isAnimating, setIsAnimating] = useState(false);

    // Text Input State
    const [textInput, setTextInput] = useState("");

    // Animation State
    const [pathResult, setPathResult] = useState<{ nodePath: string[], edgeIds: string[] } | null>(null);
    const [animationStep, setAnimationStep] = useState(-1);

    const resetColors = () => {
        edges.forEach(e => updateEdge(e.id, { color: undefined, width: undefined }));
        nodes.forEach(n => updateNode(n.id, { color: undefined }));
    };

    const parseGraphInput = () => {
        if (!textInput.trim()) return;

        const lines = textInput.trim().split('\n');
        const newNodes = new Map<string, { id: string, label: string }>();
        const newEdges: any[] = [];
        let edgeIdCounter = 0;

        lines.forEach(line => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            // Check for Adjacency List format "A: B, C"
            if (cleanLine.includes(':')) {
                const [sourcePart, targetsPart] = cleanLine.split(':');
                const source = sourcePart.trim();
                if (source) {
                    if (!newNodes.has(source)) newNodes.set(source, { id: source, label: source });

                    if (targetsPart) {
                        const targets = targetsPart.split(/[,\s]+/).filter(s => s.trim().length > 0);
                        targets.forEach(target => {
                            if (!newNodes.has(target)) newNodes.set(target, { id: target, label: target });
                            newEdges.push({
                                id: `e${edgeIdCounter++}`,
                                source,
                                target,
                                isDirected
                            });
                        });
                    }
                }
                return;
            }

            // Standard Edge List or Path format
            let parts: string[];

            // Heuristic: If commas are present, assume comma-separated (allows spaces in names like "Node 1")
            // Otherwise, split by whitespace
            if (cleanLine.includes(',')) {
                parts = cleanLine.split(',').map(s => s.trim()).filter(s => s.length > 0);
            } else if (cleanLine.includes('->')) {
                parts = cleanLine.split('->').map(s => s.trim()).filter(s => s.length > 0);
            } else {
                parts = cleanLine.split(/\s+/);
            }

            // Add all nodes mentioned
            parts.forEach(part => {
                if (!newNodes.has(part)) newNodes.set(part, { id: part, label: part });
            });

            // Create edges for pairs (A->B, B->C)
            if (parts.length >= 2) {
                for (let i = 0; i < parts.length - 1; i++) {
                    const source = parts[i];
                    const target = parts[i + 1];
                    newEdges.push({
                        id: `e${edgeIdCounter++}`,
                        source,
                        target,
                        isDirected
                    });
                }
            }
        });

        // Layout nodes in a circle
        const nodeList = Array.from(newNodes.values());
        if (nodeList.length === 0) {
            setResult("No valid nodes found in input.");
            return;
        }

        const radius = 200;
        const centerX = 400;
        const centerY = 300;

        const positionedNodes = nodeList.map((n, i) => {
            const angle = (i / nodeList.length) * 2 * Math.PI;
            return {
                ...n,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        setGraph(positionedNodes, newEdges);
        setResult(`Graph generated with ${nodeList.length} nodes and ${newEdges.length} edges.`);
        setPathResult(null);
        setAnimationStep(-1);
    };

    const handleEuler = () => {
        resetColors();
        setAnimationStep(-1);
        setPathResult(null);

        const res = checkEuler(nodes, edges, isDirected);
        setResult(res.message);

        if (res.hasPath && res.path && res.path.length > 0) {
            // Convert node path to edge path for animation
            const edgeIds: string[] = [];
            // Note: Hierholzer returns a node path. We need to map to edges.
            // Since we might have multiple edges between nodes, we need to be careful.
            // However, for visualization, picking *any* valid edge between the nodes is usually fine
            // unless we want to be strictly exact with the specific edge instance traversed.

            // A better way would be if checkEuler returned edge IDs directly, 
            // but our findPathHierholzer returns nodes.
            // Let's do a best-effort mapping.

            const tempEdges = [...edges]; // Copy to track usage if needed

            for (let i = 0; i < res.path.length - 1; i++) {
                const u = res.path[i];
                const v = res.path[i + 1];

                // Find an edge connecting u -> v
                const edgeIndex = tempEdges.findIndex(e =>
                    (e.source === u && e.target === v) ||
                    (!isDirected && e.source === v && e.target === u)
                );

                if (edgeIndex !== -1) {
                    edgeIds.push(tempEdges[edgeIndex].id);
                    // Remove to handle multi-edges correctly? 
                    // For simple graphs, not strictly necessary, but good practice.
                    tempEdges.splice(edgeIndex, 1);
                }
            }

            setPathResult({ nodePath: res.path, edgeIds });
            setAnimationStep(0);
        }
    };

    const handleHamiltonian = () => {
        if (isAnimating) return;
        resetColors();
        setResult("Searching...");
        setAnimationStep(-1);
        setPathResult(null);

        setTimeout(() => {
            const res = findHamiltonianPath(nodes, edges, isDirected);
            setResult(res.message);

            if (res.hasPath && res.path) {
                // Convert node path to edge path for animation
                const edgeIds: string[] = [];
                for (let i = 0; i < res.path.length - 1; i++) {
                    const u = res.path[i];
                    const v = res.path[i + 1];
                    const edge = edges.find(e =>
                        (e.source === u && e.target === v) ||
                        (!isDirected && e.source === v && e.target === u)
                    );
                    if (edge) edgeIds.push(edge.id);
                }

                setPathResult({ nodePath: res.path, edgeIds });
                setAnimationStep(0); // Start at beginning
            }
        }, 100);
    };

    // Animation Effect
    useEffect(() => {
        if (!pathResult) return;

        // Reset all first
        resetColors();

        // Highlight up to current step
        if (animationStep >= 0) {
            // Highlight nodes
            const currentNode = pathResult.nodePath[animationStep];
            if (currentNode) {
                updateNode(currentNode, { color: '#ef4444' }); // Highlight current node
            }

            // Highlight edges up to this step
            for (let i = 0; i < animationStep; i++) {
                const edgeId = pathResult.edgeIds[i];
                if (edgeId) updateEdge(edgeId, { color: '#3b82f6', width: 3 }); // Blue for traversed
            }
        }
    }, [animationStep, pathResult]);

    return (
        <div className="flex h-screen flex-col">
            <header className="bg-white border-b p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">Minor Project: Euler & Hamiltonian Paths</h1>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm select-none text-gray-800">
                        <input
                            type="checkbox"
                            checked={isDirected}
                            onChange={(e) => {
                                setDirected(e.target.checked);
                                resetColors();
                                setResult("");
                                setPathResult(null);
                            }}
                            className="rounded border-gray-300"
                        />
                        Directed Graph
                    </label>
                    <button
                        onClick={() => {
                            clearGraph();
                            setResult("");
                            setPathResult(null);
                            setTextInput("");
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Clear Canvas
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 bg-gray-50 border-r p-4 overflow-y-auto flex flex-col gap-6">

                    {/* Text Input Section */}
                    <div>
                        <h2 className="font-semibold mb-2 text-sm text-gray-900">Quick Input</h2>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Formats:&#10;A, B (Comma)&#10;A -> B -> C (Arrow)&#10;A B (Space)&#10;A: B, C (Adjacency)"
                            className="w-full h-24 p-2 text-sm border rounded mb-2 font-mono text-gray-900"
                        />
                        <button
                            onClick={parseGraphInput}
                            className="w-full py-1.5 px-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs font-medium"
                        >
                            Generate Graph from Text
                        </button>
                    </div>

                    {/* Algorithms Section */}
                    <div>
                        <h2 className="font-semibold mb-2 text-sm text-gray-900">Algorithms</h2>
                        <div className="space-y-2">
                            <button
                                onClick={handleEuler}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                            >
                                Check Euler Path
                            </button>
                            <button
                                onClick={handleHamiltonian}
                                className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm transition-colors"
                            >
                                Find Hamiltonian Path
                            </button>
                        </div>
                    </div>

                    {/* Results Section */}
                    {result && (
                        <div className="p-3 bg-white rounded shadow-sm border border-blue-100">
                            <h3 className="text-sm font-medium mb-1 text-gray-900">Result</h3>
                            <p className="text-sm text-gray-600 break-words">
                                {result}
                            </p>
                        </div>
                    )}

                    {/* Animation Controls */}
                    {pathResult && (
                        <div className="p-3 bg-white rounded shadow-sm border border-purple-100">
                            <h3 className="text-sm font-medium mb-2 text-gray-900">Animation Controls</h3>
                            <div className="flex justify-between items-center mb-2">
                                <button
                                    onClick={() => setAnimationStep(-1)}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                    title="Reset"
                                >
                                    ⏮
                                </button>
                                <button
                                    onClick={() => setAnimationStep(Math.max(-1, animationStep - 1))}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                    title="Previous"
                                >
                                    ◀
                                </button>
                                <span className="text-xs font-mono text-gray-900">
                                    {animationStep + 1} / {pathResult.nodePath.length}
                                </span>
                                <button
                                    onClick={() => setAnimationStep(Math.min(pathResult.nodePath.length - 1, animationStep + 1))}
                                    className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                                    title="Next"
                                >
                                    ▶
                                </button>
                            </div>
                            <div className="text-xs text-gray-500 font-mono overflow-x-auto whitespace-nowrap">
                                {pathResult.nodePath.map(id => nodes.find(n => n.id === id)?.label || id).join(' → ')}
                            </div>
                        </div>
                    )}

                    <div className="mt-auto text-xs text-gray-400">
                        <p>Left Click: Add Node</p>
                        <p>Drag: Move Node (Select Mode)</p>
                        <p>Click Node (Edge Mode): Add Edge</p>
                    </div>
                </div>

                <div className="flex-1 bg-gray-100 p-4 relative">
                    <div className="w-full h-full bg-white rounded-lg shadow-sm border overflow-hidden">
                        <GraphCanvas />
                    </div>
                </div>
            </div>
        </div>
    );
}
