"use client";

import GraphCanvas from '@/components/GraphCanvas';
import { useGraphStore, Node, Edge } from '@/lib/useGraphStore';
import { greedyColoring, backtrackingColoring, dsaturColoring } from '@/lib/graph-algorithms';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';

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

export default function ProjectC() {
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
    const [algorithm, setAlgorithm] = useState<'greedy' | 'dsatur'>('greedy');

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
            const angle = (i / graphCourses.length) * 2 * Math.PI;
            nodes.push({
                id: course.id,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
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

        setGraph(nodes, edges);
        setView('graph');
        setSchedule(new Map());
        setColorsUsed(0);
    };

    const generateSchedule = () => {
        // We need to reconstruct the graph data for the algorithm
        // Since we don't store the "graphCourses" in state, we re-derive them or use the graph store nodes
        // Using graph store nodes is safer as it matches what's on screen
        const currentNodes = useGraphStore.getState().nodes;
        const currentEdges = useGraphStore.getState().edges;

        let result;
        if (algorithm === 'greedy') {
            result = greedyColoring(currentNodes, currentEdges);
        } else {
            result = dsaturColoring(currentNodes, currentEdges);
        }

        const { colors, maxColor } = result;
        setSchedule(colors);
        setColorsUsed(maxColor);

        // Update graph visualization with colors
        // For Exam Mode: We want to color by SEMESTER to show that same-semester exams are distinct?
        // OR color by TIME SLOT to show the schedule?
        // Standard is coloring by Time Slot (Chromatic Coloring).

        const colorPalette = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
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
                    <h1 className="text-xl font-bold text-gray-800">Project C: Timetable Scheduling</h1>
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
                                    onChange={(e) => setAlgorithm(e.target.value as 'greedy' | 'dsatur')}
                                    className="w-full text-sm border rounded p-1 text-gray-900"
                                >
                                    <option value="greedy">Greedy (Welsh-Powell)</option>
                                    <option value="dsatur">DSATUR (Research Paper)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {algorithm === 'dsatur' ?
                                        "Dynamic saturation degree ordering. Often uses fewer colors." :
                                        "Static degree ordering. Fast but less optimal."}
                                </p>
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
                                <button
                                    onClick={() => setView('graph')}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Back to Graph
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {Array.from({ length: colorsUsed }).map((_, i) => {
                                    const slot = i + 1;
                                    // Find nodes scheduled in this slot
                                    const slotNodeIds = Array.from(schedule.entries())
                                        .filter(([id, s]) => s === slot)
                                        .map(([id]) => id);

                                    // Retrieve details based on mode
                                    // We need to look up details from the graph nodes or original data
                                    // Since we don't have easy lookup for Exam Mode parsed data, we'll use the Node labels from the store
                                    const storeNodes = useGraphStore.getState().nodes;
                                    const slotNodes = storeNodes.filter(n => slotNodeIds.includes(n.id));

                                    const colorPalette = ['bg-red-50 border-red-200', 'bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-yellow-50 border-yellow-200', 'bg-purple-50 border-purple-200', 'bg-pink-50 border-pink-200'];
                                    const style = colorPalette[(slot - 1) % colorPalette.length];
                                    const headerColor = style.replace('bg-', 'text-').replace('50', '700').replace('border-', ''); // Hacky color derivation

                                    return (
                                        <div key={slot} className={`border rounded-xl overflow-hidden shadow-sm ${style}`}>
                                            <div className={`p-3 border-b bg-white/50 font-bold flex items-center gap-2 ${headerColor}`}>
                                                <Calendar size={18} /> Slot {slot}
                                            </div>
                                            <div className="p-3 space-y-2">
                                                {slotNodes.map(node => (
                                                    <div key={node.id} className="bg-white p-2 rounded border shadow-sm text-sm">
                                                        <div className="font-semibold text-gray-800">{node.label}</div>
                                                        {mode === 'exam' && (
                                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                                                                    {node.id.split('-')[0]}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
