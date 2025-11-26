"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGraphStore, Node, Edge } from '@/lib/useGraphStore';
import { cn } from '@/lib/utils';
import { Plus, Move, Trash2 } from 'lucide-react';

type InteractionMode = 'select' | 'node' | 'edge';

export default function GraphCanvas() {
    const { nodes, edges, addNode, updateNode, addEdge, removeNode, removeEdge, isDirected } = useGraphStore();
    const [mode, setMode] = useState<InteractionMode>('node');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Helper to get SVG coordinates
    const getMousePos = (e: React.MouseEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const CTM = svgRef.current.getScreenCTM();
        if (!CTM) return { x: 0, y: 0 };
        return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (mode === 'node') {
            const { x, y } = getMousePos(e);
            const newNode: Node = {
                id: crypto.randomUUID(),
                x,
                y,
                label: `${nodes.length + 1}`
            };
            addNode(newNode);
        } else if (mode === 'select') {
            setSelectedNode(null);
        }
    };

    const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        if (mode === 'edge') {
            if (selectedNode === null) {
                setSelectedNode(nodeId);
            } else {
                if (selectedNode !== nodeId) {
                    // Create edge
                    const newEdge: Edge = {
                        id: crypto.randomUUID(),
                        source: selectedNode,
                        target: nodeId,
                        isDirected: isDirected
                    };
                    // Check if edge already exists
                    const exists = edges.some(edge =>
                        (edge.source === selectedNode && edge.target === nodeId) ||
                        (!isDirected && edge.source === nodeId && edge.target === selectedNode)
                    );

                    if (!exists) {
                        addEdge(newEdge);
                    }
                    setSelectedNode(null);
                } else {
                    setSelectedNode(null); // Deselect if clicking same node
                }
            }
        } else if (mode === 'select') {
            setSelectedNode(nodeId);
        } else if (mode === 'node') {
            // Maybe allow moving? For now just select
            setSelectedNode(nodeId);
        }
    };

    const handleNodeDrag = (e: any, info: any, nodeId: string) => {
        // Update node position in store after drag
        // Note: Framer motion handles the visual drag, but we need to update the store for edges to follow
        // However, updating store on every frame might be expensive.
        // Better to use onDragEnd or update local state and sync.
        // For simplicity in this prototype, we'll try onDragEnd or use a ref for live updates if needed.
        // Actually, for edges to move with nodes, we need state updates.
        // Let's try updating onDrag.
        // We need to convert info.point to SVG coords?
        // Framer motion drag is relative to the element or parent.
        // It's easier to implement custom drag logic with mouse events for SVG.
    };

    // Custom drag implementation for SVG
    const [draggingNode, setDraggingNode] = useState<string | null>(null);

    const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
        if (mode === 'select') {
            setDraggingNode(nodeId);
            e.stopPropagation();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode && mode === 'select') {
            const { x, y } = getMousePos(e);
            updateNode(draggingNode, { x, y });
        }
    };

    const handleMouseUp = () => {
        setDraggingNode(null);
    };

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex gap-2 p-2 bg-gray-100 border-b">
                <button
                    className={cn("p-2 rounded", mode === 'select' ? "bg-blue-500 text-white" : "bg-white")}
                    onClick={() => setMode('select')}
                    title="Select / Move"
                >
                    <Move size={20} />
                </button>
                <button
                    className={cn("p-2 rounded", mode === 'node' ? "bg-blue-500 text-white" : "bg-white")}
                    onClick={() => setMode('node')}
                    title="Add Node"
                >
                    <Plus size={20} />
                </button>
                <button
                    className={cn("p-2 rounded", mode === 'edge' ? "bg-blue-500 text-white" : "bg-white")}
                    onClick={() => setMode('edge')}
                    title="Add Edge"
                >
                    <div className="w-5 h-5 border-b-2 border-current transform -rotate-45 translate-y-1" />
                </button>
                <button
                    className="p-2 rounded bg-red-100 text-red-600 ml-auto"
                    onClick={() => {
                        if (selectedNode) {
                            removeNode(selectedNode);
                            setSelectedNode(null);
                        }
                    }}
                    disabled={!selectedNode}
                    title="Delete Selected"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            <div className="flex-1 bg-white relative overflow-hidden">
                <svg
                    ref={svgRef}
                    className="w-full h-full cursor-crosshair"
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="28" // Adjust based on node radius
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                        </marker>
                    </defs>

                    {/* Edges */}
                    {edges.map(edge => {
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if (!source || !target) return null;

                        return (
                            <line
                                key={edge.id}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke={edge.color || "#9ca3af"}
                                strokeWidth="2"
                                markerEnd={isDirected || edge.isDirected ? "url(#arrowhead)" : undefined}
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map(node => (
                        <g
                            key={node.id}
                            transform={`translate(${node.x}, ${node.y})`}
                            onMouseDown={(e) => handleMouseDown(e, node.id)}
                            onClick={(e) => handleNodeClick(e, node.id)}
                            className="cursor-pointer"
                        >
                            <circle
                                r="20"
                                fill={node.color || "white"}
                                stroke={selectedNode === node.id ? "#3b82f6" : "#000"}
                                strokeWidth={selectedNode === node.id ? "3" : "2"}
                                className="transition-colors"
                            />
                            <text
                                textAnchor="middle"
                                dy=".3em"
                                className="select-none pointer-events-none text-sm font-bold"
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}

                    {/* Ghost Edge for Edge Creation Mode */}
                    {mode === 'edge' && selectedNode && hoveredNode && (
                        // This would require tracking mouse pos relative to selected node
                        // Skipping for MVP, but good for polish
                        null
                    )}
                </svg>

                <div className="absolute bottom-4 left-4 bg-white/80 p-2 rounded text-sm text-gray-600 pointer-events-none">
                    Mode: {mode.toUpperCase()}
                    {mode === 'edge' && selectedNode && " (Select target node)"}
                </div>
            </div>
        </div>
    );
}
