"use client";

import GraphCanvas from '@/components/GraphCanvas';
import { useGraphStore, Node, Edge } from '@/lib/useGraphStore';
import { greedyColoring, backtrackingColoring, dsaturColoring, balancedColoring } from '@/lib/graph-algorithms';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, FileJson } from 'lucide-react';
import timetableData from '@/lib/data/timetable_default.json';
import { buildConstraintGraph } from '@/lib/scheduling-logic';
import { Course as BitsCourse } from '@/lib/types';
import { forceDirectedLayout } from '@/lib/layout-logic';
import { useRef } from 'react';

type Course = {
    id: string;
    name: string;
    teacher: string;
    students: string; // Comma separated for input simplicity
};

const DEFAULT_COURSES: Course[] = [
    { id: '1', name: 'Math 101', teacher: 'Dr. Smith', students: 'Group A' },
    { id: '2', name: 'Physics 101', teacher: 'Dr. Jones', students: 'Group A' },
    { id: '3', name: 'Chem 101', teacher: 'Dr. Smith', students: 'Group B' },
    { id: '4', name: 'Bio 101', teacher: 'Dr. Doe', students: 'Group B' },
    { id: '5', name: 'CS 101', teacher: 'Dr. Jones', students: 'Group C' },
];

export default function MajorProject() {
    const { setGraph, updateNode } = useGraphStore();

    // Mode State
    const [mode, setMode] = useState<'class' | 'exam'>('class');

    // Class Mode State
    const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);

    // Exam Mode State
    const [examInput, setExamInput] = useState("Sem 1: Math 101, Eng 101, CS 101\nSem 2: Physics 101, Chem 101, Bio 101");

    // Shared State
    const [schedule, setSchedule] = useState<Map<string, number>>(new Map());
    const [colorsUsed, setColorsUsed] = useState(0);
    const [view, setView] = useState<'input' | 'graph' | 'timetable'>('input');
    const [algorithm, setAlgorithm] = useState<'greedy' | 'dsatur' | 'balanced'>('balanced');

    // Filtering State
    const [selectedDept, setSelectedDept] = useState<string>('CS');
    const [includeGroupConflicts, setIncludeGroupConflicts] = useState(false);

    // BITS Data departments
    const uniqueDepts = Array.from(new Set(
        (timetableData as unknown as BitsCourse[])
            .filter(c => c.id && c.id.split(' ')[0].length > 1)
            .map(c => c.id.split(' ')[0])
    )).sort();

    // ... (keep existing add/remove/update course functions) ...
    const addCourse = () => {
        setCourses([...courses, {
            id: crypto.randomUUID(),
            name: 'New Course',
            teacher: '',
            students: ''
        }]);
    };

    const removeCourse = (id: string) => {
        setCourses(courses.filter(c => c.id !== id));
    };

    const updateCourse = (id: string, field: keyof Course, value: string) => {
        setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const loadBitsData = () => {
        // Cast JSON to Course[] type safely
        const rawData = timetableData as unknown as BitsCourse[];

        // Filter data based on selection
        const filteredData = selectedDept === 'ALL'
            ? rawData
            : rawData.filter(c => c.id.startsWith(selectedDept));

        const { nodes, edges } = buildConstraintGraph(filteredData, { includeGroupConflicts });
        setGraph(nodes, edges);
        setView('graph');
        // Reset schedule
        setSchedule(new Map());
        setColorsUsed(0);
    };

    const generateGraph = () => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        let graphCourses: { id: string, name: string, group: string }[] = [];

        if (mode === 'class') {
            graphCourses = courses.map(c => ({ id: c.id, name: c.name, group: c.teacher })); // Group by teacher for coloring
        } else {
            // Parse Exam Input
            const lines = examInput.split('\n');
            lines.forEach((line, i) => {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const semester = parts[0].trim();
                    const subjects = parts[1].split(',').map(s => s.trim());
                    subjects.forEach((subj, j) => {
                        if (subj) {
                            graphCourses.push({
                                id: `${semester}-${subj}`, // Unique ID
                                name: subj,
                                group: semester
                            });
                        }
                    });
                }
            });
        }

        // Create nodes (Circle Layout)
        const radius = 200;
        const centerX = 400;
        const centerY = 300;

        graphCourses.forEach((course, i) => {
            // Initial random positions for simulation
            nodes.push({
                id: course.id,
                x: centerX + (Math.random() - 0.5) * 500, // Reduced initial spread to let physics work
                y: centerY + (Math.random() - 0.5) * 500,
                label: course.name,
                color: undefined // Reset color
            });
        });

        // Create edges
        for (let i = 0; i < graphCourses.length; i++) {
            for (let j = i + 1; j < graphCourses.length; j++) {
                const c1 = graphCourses[i];
                const c2 = graphCourses[j];
                let conflict = false;

                if (mode === 'class') {
                    // Re-find original course objects for detailed check
                    const originalC1 = courses.find(c => c.id === c1.id);
                    const originalC2 = courses.find(c => c.id === c2.id);
                    if (originalC1 && originalC2) {
                        const sameTeacher = originalC1.teacher === originalC2.teacher;
                        const s1 = originalC1.students.split(',').map(s => s.trim());
                        const s2 = originalC2.students.split(',').map(s => s.trim());
                        const overlappingStudents = s1.some(s => s && s2.includes(s));
                        conflict = sameTeacher || overlappingStudents;
                    }
                } else {
                    // Exam Mode: Conflict if same semester (Group)
                    if (c1.group === c2.group) {
                        conflict = true;
                    }
                }

                if (conflict) {
                    edges.push({
                        id: `${c1.id}-${c2.id}`,
                        source: c1.id,
                        target: c2.id,
                        isDirected: false
                    });
                }
            }
        }

        // Apply Force Directed Layout
        // Run more iterations for "Major Project" polish
        const laidOutNodes = forceDirectedLayout(nodes, edges, 800, 600, 1000); // 1000 iterations
        setGraph(laidOutNodes, edges);
        setView('graph');
        setSchedule(new Map());
        setColorsUsed(0);
    };

    // Helper functions for Export
    const downloadImage = () => {
        const svg = document.querySelector('svg');
        if (!svg) return;

        // precise serialization
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);

        // Add name spaces
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+xmlns:xlink/)) {
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Add xml declaration
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        // Convert to blob and download
        const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

        const a = document.createElement('a');
        a.download = 'graph.svg';
        a.href = url;
        a.click();
    };

    const downloadCSV = () => {
        let csv = 'Time,Mon,Tue,Wed,Thu,Fri\n';

        // Columns for Days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const nodes = useGraphStore.getState().nodes;

        // Iterate Rows (Hours)
        for (let h = 0; h < 10; h++) {
            const hour = 8 + h;
            const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
            let row = `"${timeLabel}"`;

            for (let d = 0; d < 5; d++) {
                const slotIndex = (d * 10) + h + 1;

                // Find courses in this slot
                const courseIds = Array.from(schedule.entries())
                    .filter(([_, color]) => color === slotIndex)
                    .map(([id]) => id);

                // Get names
                const courseNames = courseIds.map(id => {
                    const n = nodes.find(node => node.id === id);
                    return n?.label || id;
                });

                // Group duplicates like in the UI
                const counts = new Map<string, number>();
                courseNames.forEach(name => counts.set(name, (counts.get(name) || 0) + 1));

                const cellText = Array.from(counts.entries())
                    .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
                    .join('; ');

                row += `,"${cellText}"`;
            }
            csv += row + '\n';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable_grid.csv';
        a.click();
    };

    const generateSchedule = () => {
        // We need to reconstruct the graph data for the algorithm
        // Since we don't store the "graphCourses" in state, we re-derive them or use the graph store nodes
        // Using graph store nodes is safer as it matches what's on screen
        const currentNodes = useGraphStore.getState().nodes;
        const currentEdges = useGraphStore.getState().edges;

        let result: { colors: Map<string, number>, maxColor: number } | Map<string, number>;

        if (algorithm === 'greedy') {
            result = greedyColoring(currentNodes, currentEdges);
        } else if (algorithm === 'balanced') {
            result = balancedColoring(currentNodes, currentEdges, 50); // 5 days * 10 hours
        } else { // dsatur
            result = dsaturColoring(currentNodes, currentEdges);
        }

        let colors: Map<string, number>;
        let max = 0;

        if (result instanceof Map) {
            colors = result;
            max = 0;
            for (const c of colors.values()) {
                if (c > max) max = c;
            }
        } else {
            colors = result.colors;
            max = result.maxColor;
        }

        setSchedule(colors);
        setColorsUsed(max);

        // Update graph visualization with colors
        // For Exam Mode: We want to color by SEMESTER to show that same-semester exams are distinct?
        // OR color by TIME SLOT to show the schedule?
        // Standard is coloring by Time Slot (Chromatic Coloring).

        const colorPalette = ['#ef4444', '#3b82f6', '#22c5e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
        colors.forEach((colorIndex, nodeId) => {
            const colorHex = colorPalette[(colorIndex - 1) % colorPalette.length];
            updateNode(nodeId, { color: colorHex });
        });

        setView('timetable');
    };

    return (
        <div className="flex h-screen flex-col">
            <header className="bg-white border-b p-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Major Project: Timetable Scheduling</h1>
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={() => { setMode('class'); setView('input'); }}
                            className={`text-xs px-2 py-0.5 rounded ${mode === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Class Schedule
                        </button>
                        <button
                            onClick={() => { setMode('exam'); setView('input'); }}
                            className={`text-xs px-2 py-0.5 rounded ${mode === 'exam' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Exam Schedule
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setView('input')}
                        className={`px-3 py-1 rounded text-sm ${view === 'input' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    >
                        Input
                    </button>
                    <button
                        onClick={() => {
                            if (view === 'input') generateGraph();
                            setView('graph');
                        }}
                        className={`px-3 py-1 rounded text-sm ${view === 'graph' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                    >
                        Conflict Graph
                    </button>
                    <button
                        onClick={() => setView('timetable')}
                        disabled={schedule.size === 0}
                        className={`px-3 py-1 rounded text-sm ${view === 'timetable' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'} disabled:opacity-50`}
                    >
                        Timetable
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden bg-gray-50 p-6">
                {view === 'input' && (
                    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
                        {mode === 'class' ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Class Data</h2>
                                    <button onClick={addCourse} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
                                        <Plus size={16} /> Add Course
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-gray-900">Course Name</th>
                                                <th className="px-4 py-3 text-gray-900">Teacher</th>
                                                <th className="px-4 py-3 text-gray-900">Student Groups</th>
                                                <th className="px-4 py-3 text-gray-900">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.map(course => (
                                                <tr key={course.id} className="border-b">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={course.name}
                                                            onChange={e => updateCourse(course.id, 'name', e.target.value)}
                                                            className="border rounded px-2 py-1 w-full text-gray-900"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={course.teacher}
                                                            onChange={e => updateCourse(course.id, 'teacher', e.target.value)}
                                                            className="border rounded px-2 py-1 w-full text-gray-900"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            value={course.students}
                                                            onChange={e => updateCourse(course.id, 'students', e.target.value)}
                                                            className="border rounded px-2 py-1 w-full text-gray-900"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button onClick={() => removeCourse(course.id)} className="text-red-600 hover:text-red-800">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold mb-2 text-gray-900">Exam Schedule Input</h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Enter exams grouped by Semester. Exams in the same semester cannot be scheduled at the same time.
                                    </p>
                                    <textarea
                                        value={examInput}
                                        onChange={(e) => setExamInput(e.target.value)}
                                        className="w-full h-64 p-4 border rounded-lg font-mono text-sm text-gray-900"
                                        placeholder="Semester 1: Math, English, Science&#10;Semester 2: History, Geography"
                                    />
                                </div>
                            </>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={generateGraph}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                            >
                                Generate Conflict Graph
                            </button>
                            <button
                                onClick={loadBitsData}
                                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 font-medium ml-2 flex items-center gap-2"
                            >
                                <FileJson size={18} /> Load {selectedDept} Data
                            </button>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                            <h3 className="font-semibold text-gray-800 mb-2">BITS Pilani Data Filters</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    Department:
                                    <select
                                        value={selectedDept}
                                        onChange={(e) => setSelectedDept(e.target.value)}
                                        className="border rounded p-1"
                                    >
                                        <option value="CS">Computer Science (CS)</option>
                                        <option value="BIO">Biology (BIO)</option>
                                        <option value="EEE">Electrical (EEE)</option>
                                        <option value="MATH">Mathematics (MATH)</option>
                                        <option value="PHY">Physics (PHY)</option>
                                        <option value="CHEM">Chemistry (CHEM)</option>
                                        <option value="ALL">ALL (Caution: Heavy)</option>
                                        {uniqueDepts.filter(d => !['CS', 'BIO', 'EEE', 'MATH', 'PHY', 'CHEM'].includes(d)).map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex items-center gap-2 text-sm text-gray-700" title="Connects all students in same Year/Group. Generates MANY edges.">
                                    <input
                                        type="checkbox"
                                        checked={includeGroupConflicts}
                                        onChange={(e) => setIncludeGroupConflicts(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    Include Year-Group Conflicts (Heavy)
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'graph' && (
                    <div className="flex h-full gap-4">
                        <div className="w-64 bg-white rounded shadow p-4 flex flex-col">
                            <h2 className="font-semibold mb-2 text-gray-900">Graph View</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                {mode === 'class'
                                    ? "Nodes are courses. Edges represent conflicts (same teacher or student group)."
                                    : "Nodes are exams. Edges represent conflicts (same semester)."
                                }
                            </p>
                            <button
                                onClick={generateSchedule}
                                className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium mt-auto"
                            >
                                Generate Schedule
                            </button>

                            <div className="mt-4 pt-4 border-t">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Algorithm</label>
                                <select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value as 'greedy' | 'dsatur' | 'balanced')}
                                    className="w-full text-sm border rounded p-1 text-gray-900"
                                >
                                    <option value="balanced">Balanced Distribution (Spread classes evenly)</option>
                                    <option value="greedy">Greedy (Welsh-Powell) - Compact</option>
                                    <option value="dsatur">DSATUR - Optimized Compact</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {algorithm === 'balanced' ? "Distributes classes across the full week to avoid crowding." : "Tries to use minimum time slots."}
                                </p>
                                <button onClick={downloadImage} className="w-full mt-4 py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium">
                                    Download Graph (SVG)
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white rounded shadow border overflow-hidden">
                            <GraphCanvas />
                        </div>
                    </div>
                )}

                {view === 'timetable' && (
                    <div className="max-w-6xl mx-auto h-full overflow-y-auto">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Generated {mode === 'class' ? 'Class' : 'Exam'} Schedule</h2>
                                    <p className="text-sm text-gray-500">
                                        Algorithm: <span className="font-medium">{algorithm === 'dsatur' ? 'DSATUR' : 'Greedy'}</span> •
                                        Min Slots: <span className="font-bold text-blue-600">{colorsUsed}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={downloadCSV}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 font-medium flex items-center gap-1"
                                    >
                                        <FileJson size={16} /> Export CSV
                                    </button>
                                    <button
                                        onClick={() => setView('graph')}
                                        className="text-sm text-blue-600 hover:underline px-3"
                                    >
                                        Back to Graph
                                    </button>
                                </div>
                            </div>



                            {/* Detailed Timetable Grid View */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[800px] border rounded-lg bg-white">
                                    <div className="grid grid-cols-6 border-b bg-gray-50">
                                        <div className="p-3 font-semibold text-gray-500 text-sm border-r">Time</div>
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                            <div key={day} className="p-3 font-bold text-gray-800 text-center border-r last:border-r-0">{day}</div>
                                        ))}
                                    </div>

                                    {/* Generate Time Rows (8 AM to 5 PM) */}
                                    {Array.from({ length: 10 }).map((_, hourIndex) => {
                                        const hour = 8 + hourIndex; // 8, 9, ... 17
                                        const timeLabel = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

                                        return (
                                            <div key={hour} className="grid grid-cols-6 border-b last:border-b-0 min-h-[100px]">
                                                <div className="p-3 text-xs font-medium text-gray-500 border-r flex items-start justify-center pt-4">
                                                    {timeLabel}
                                                </div>

                                                {/* Days Columns */}
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIndex) => {
                                                    // Mapping Strategy:
                                                    // We have 'colors' (1..N). We need to map them to (Day, Hour).
                                                    // Let's assume Color 1 = Mon 8am, Color 2 = Mon 9am...
                                                    // Total Slots per week = 5 days * 10 hours = 50 slots.
                                                    // Slot Index = (DayIndex * 10) + HourIndex + 1

                                                    const slotIndex = (dayIndex * 10) + hourIndex + 1;

                                                    // Find courses assigned to this slot (Color == SlotIndex)
                                                    // Note: Greedy might use fewer colors than 50.
                                                    // If Color > 50, we wrap around or show overflow?
                                                    // Let's try to map the color directly to a specific slot for now.

                                                    const cellNodeIds = Array.from(schedule.entries())
                                                        .filter(([id, color]) => {
                                                            // Create a simple deterministic mapping from Color -> Slot
                                                            // If we have 4 colors (minimal coloring), we need to distribute them.
                                                            // This is tricky without a real Constraint Satisfaction Solver that targets specific time slots.
                                                            // Current "Graph Coloring" just says "These items are different".
                                                            // VISUALIZATION HACK:
                                                            // Distribute the items of "Color 1" across available "Mon 8am" slots across rooms?
                                                            // No, that's confusing.

                                                            // BETTER APPROACH for "Coloring Output":
                                                            // Just map Color X -> Slot X.
                                                            // If Greedy used 4 colors, it means we only need 4 time slots to schedule everything without conflict.
                                                            // That's incredibly efficient! It means everything happens in Mon 8am - Mon 11am.
                                                            // But User wants to see a full spread.

                                                            // Let's map Color X to Slot X.
                                                            // But if Color is 1, all 100 courses are at Mon 8am? Yes, that's what "Color 1" means.
                                                            // Why so many? Because they don't conflict! 
                                                            // (e.g. 100 different rooms, 100 different teachers).

                                                            return color === slotIndex;
                                                        })
                                                        .map(([id]) => id);

                                                    // Retrieve details
                                                    const storeNodes = useGraphStore.getState().nodes;
                                                    const cellNodes = storeNodes.filter(n => cellNodeIds.includes(n.id));

                                                    // Group nodes by label to avoid spam
                                                    // Count occurrences of each label
                                                    const counts = new Map<string, number>();
                                                    cellNodes.forEach(node => {
                                                        const lbl = node.label || node.id;
                                                        counts.set(lbl, (counts.get(lbl) || 0) + 1);
                                                    });

                                                    return (
                                                        <div key={`${day}-${hour}`} className="border-r last:border-r-0 p-1 relative group bg-white hover:bg-gray-50 transition-colors">
                                                            <div className="flex flex-col gap-1 h-full overflow-y-auto max-h-[120px] scrollbar-thin">
                                                                {Array.from(counts.entries()).map(([label, count]) => (
                                                                    <div key={label} className="bg-blue-100 text-blue-900 text-[10px] p-1 rounded border border-blue-200 truncate cursor-help shadow-sm" title={`${label} (${count} sections)`}>
                                                                        {label} {count > 1 && <span className="font-bold">({count})</span>}
                                                                    </div>
                                                                ))}
                                                                {/* Helper text if empty? No, keep clean */}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
