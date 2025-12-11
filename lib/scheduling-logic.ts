import { Course, SchedulingNode, ConstraintEdge } from './types';
import { Node, Edge } from './useGraphStore';

export function buildConstraintGraph(courses: Course[], options: { includeGroupConflicts: boolean } = { includeGroupConflicts: false }): { nodes: Node[], edges: Edge[], schedulingNodes: SchedulingNode[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const schedulingNodes: SchedulingNode[] = [];

    // 1. Flatten Courses into Scheduling Nodes
    courses.forEach(course => {
        // Filter out garbage entries (e.g. headers identified by parsing issues)
        if (!course.id || course.id.length < 3 || course.id.includes("COURSE")) return;

        course.sections.forEach((section, idx) => {
            // Skip empty sections
            if (!section.instructor && !section.room && !section.days) return;

            // Ensure uniqueness by appending global index or using a counter if needed
            // The issue is likely that section numbers might be repeated or empty in PDF extraction
            // Let's use loop index combined with section to be safe
            const nodeId = `${course.id}_${section.type}_${section.section || '0'}_${idx}`;

            // Infer Group: Year + Dept? 
            // Heuristic: F1xx -> Year 1, F2xx -> Year 2
            // Dept: First word of Title or Code prefix
            const yearGroup = course.id.match(/F(\d)/)?.[1] || "Unknown";
            const dept = course.id.split(' ')[0]; // e.g., BIO
            const groups = [`Year${yearGroup}`, `${dept}_Year${yearGroup}`];

            const sNode: SchedulingNode = {
                id: nodeId,
                label: `${course.id} ${section.type}${section.section ? ` (${section.section})` : ''}`,
                courseId: course.id,
                type: section.type,
                instructor: section.instructor,
                room: section.room,
                groups: groups
            };

            schedulingNodes.push(sNode);

            // Add Visual Node
            nodes.push({
                id: nodeId,
                x: 0, // Layout will handle this
                y: 0,
                label: sNode.label,
                color: getDeptColor(dept) // Visual sugar
            });
        });
    });

    // 2. Build Constraint Edges
    for (let i = 0; i < schedulingNodes.length; i++) {
        for (let j = i + 1; j < schedulingNodes.length; j++) {
            const n1 = schedulingNodes[i];
            const n2 = schedulingNodes[j];

            let conflictType: "instructor" | "room" | "group" | null = null;
            let conflictLabel = "";

            // Instructor Conflict
            if (n1.instructor && n2.instructor && n1.instructor === n2.instructor) {
                // Ignore "TBA" or generic names if any
                if (n1.instructor.length > 2) {
                    conflictType = "instructor";
                    conflictLabel = `Same Instructor: ${n1.instructor}`;
                }
            }

            // Room Conflict
            // Check if rooms are valid real rooms (not generic placeholders)
            if (!conflictType && n1.room && n2.room && n1.room === n2.room) {
                if (n1.room.length > 1) {
                    conflictType = "room";
                    conflictLabel = `Same Room: ${n1.room}`;
                }
            }

            // Group Conflict (Constraint: Students cannot be in two places)
            // If they share a group (e.g. Year1_BIO)
            if (!conflictType && options.includeGroupConflicts) {
                const commonGroup = n1.groups.find(g => n2.groups.includes(g));
                if (commonGroup && commonGroup !== "YearUnknown") {
                    // For 1st year common courses (F111), they often share strict schedules
                    // Heuristic: Connect all Year 1 courses? Might be too dense.
                    // Let's connect if they are in the same 'Semester' block implicitly.
                    // For now, let's optionally add this or keep it looser.
                    // The user prompt suggested "Connect all F111".

                    // Let's implement strict Year-Department conflict
                    conflictType = "group";
                    conflictLabel = `Same Group: ${commonGroup}`;
                }
            }

            if (conflictType) {
                edges.push({
                    id: `${n1.id}-${n2.id}`,
                    source: n1.id,
                    target: n2.id,
                    isDirected: false,
                    color: conflictType === 'instructor' ? '#ef4444' : conflictType === 'room' ? '#eab308' : '#3b82f6',
                    width: 2
                });
            }
        }
    }

    // Apply Circular Layout
    const radius = Math.min(800, nodes.length * 15);
    const centerX = 500;
    const centerY = 500;
    nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        n.x = centerX + radius * Math.cos(angle);
        n.y = centerY + radius * Math.sin(angle);
    });

    return { nodes, edges, schedulingNodes };
}

function getDeptColor(dept: string): string {
    const colors: Record<string, string> = {
        'BIO': '#86efac', // Green
        'CS': '#93c5fd', // Blue
        'EEE': '#fca5a5', // Red
        'INSTR': '#fcd34d', // Yellow
        'MATH': '#d8b4fe', // Purple
        'PHY': '#f0abfc', // Pink
        'CHEM': '#67e8f9', // Cyan
        'ECON': '#cbd5e1', // Gray
        'HSS': '#fda4af',
    };
    return colors[dept] || '#e5e7eb';
}
