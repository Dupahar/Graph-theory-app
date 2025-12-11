export interface CourseSection {
    section: string;
    instructor: string;
    room: string;
    days: string;
    hours: number[];
    type: "L" | "P" | "T";
}

export interface Course {
    id: string; // Course No (e.g. BIO F111)
    title: string;
    credits: string;
    sections: CourseSection[];
}

export interface SchedulingNode {
    id: string; // Unique ID composed of CourseID + SectionType + SectionIndex
    label: string;
    courseId: string;
    type: "L" | "P" | "T";
    instructor: string;
    room: string;
    groups: string[]; // Inferred student groups
    originalTimeSlots?: string[]; // If we want to validate existing schedule
}

export interface ConstraintEdge {
    source: string;
    target: string;
    type: "instructor" | "room" | "group";
    label: string;
}
