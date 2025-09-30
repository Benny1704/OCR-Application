// src/contexts/SectionContext.tsx
import { createContext, useContext, useState, useEffect,type ReactNode, useCallback } from 'react';
import { getSections } from '../lib/api/Api';
import { type Section } from '../interfaces/Types';

type SectionFilter = 'overall' | 'current';

// Define the shape of the data our context will provide
interface SectionContextType {
    sections: Section[];
    loading: boolean;
    error: string | null;
    getSectionNameById: (id: number) => string; // The lookup function
    sectionFilter: SectionFilter;
    setSectionFilter: (filter: SectionFilter) => void;
}

// Create the actual context
const SectionContext = createContext<SectionContextType | undefined>(undefined);

// Create the Provider component that will wrap our application
export const SectionProvider = ({ children }: { children: ReactNode }) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sectionFilter, setSectionFilter] = useState<SectionFilter>('overall');

    useEffect(() => {
        // This function runs once when the component is first rendered
        const fetchAndSetSections = async () => {
            try {
                const fetchedSections = await getSections();
                setSections(fetchedSections);
            } catch (err: any) {
                setError(err.message || "Could not load sections.");
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetSections();
    }, []); // The empty array [] means this effect runs only once

    // This is our helper function to find a name from an ID.
    // useCallback ensures the function isn't recreated on every render, which is a performance optimization.
    const getSectionNameById = useCallback((id: number): string => {
        const section = sections.find(s => s.section_id === id);
        return section ? section.section_name : `ID: ${id}`; // Return the name, or the ID as a fallback
    }, [sections]); // This function will update if the 'sections' array ever changes

    // The value provided to all consuming components
    const value = { sections, loading, error, getSectionNameById, sectionFilter, setSectionFilter };

    return (
        <SectionContext.Provider value={value}>
            {children}
        </SectionContext.Provider>
    );
};

// Create a custom hook for easy access to the context
export const useSections = () => {
    const context = useContext(SectionContext);
    if (context === undefined) {
        throw new Error('useSections must be used within a SectionProvider');
    }
    return context;
};