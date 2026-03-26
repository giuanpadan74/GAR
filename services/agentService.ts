import { Agent } from '../types';
import { supabase } from './supabaseClient';

const getAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase.from('agents').select('*').order('name', { ascending: true });
    
    if (error) {
        console.error('Errore nel caricamento degli agenti:', error.message);
        return [];
    }

    if (!data) {
        return [];
    }
    
    // Map snake_case 'assigned_municipalities' from Supabase to camelCase 'assignedMunicipalities'
    return data.map(agent => ({
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        color: agent.color,
        assignedMunicipalities: agent.assigned_municipalities || [],
    }));
};

const addAgent = async (agentData: Omit<Agent, 'id'>): Promise<boolean> => {
    const agentForSupabase = {
        name: agentData.name,
        phone: agentData.phone,
        email: agentData.email,
        color: agentData.color,
        assigned_municipalities: agentData.assignedMunicipalities || [],
    };

    const { error } = await supabase
        .from('agents')
        .insert([agentForSupabase]);

    if (error) {
        console.error("Errore nell'aggiunta dell'agente:", error.message);
        return false;
    }

    return true;
};

const updateAgent = async (id: number, updates: Partial<Agent>): Promise<boolean> => {
    
    const { assignedMunicipalities, ...otherUpdates } = updates;
    const updatesForSupabase: { [key: string]: any } = { ...otherUpdates };

    if (assignedMunicipalities !== undefined) {
        updatesForSupabase.assigned_municipalities = assignedMunicipalities;
    }
    
    const { error } = await supabase
        .from('agents')
        .update(updatesForSupabase)
        .eq('id', id);

    if (error) {
        console.error("Errore nell'aggiornamento dell'agente:", error.message);
        return false;
    }

    return true;
};

const deleteAgent = async (id: number): Promise<boolean> => {
    const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', id);

    if (error) {
        console.error("Errore nell'eliminazione dell'agente:", error.message);
        return false;
    }

    return true;
};

const agentService = {
    getAgents,
    addAgent,
    updateAgent,
    deleteAgent,
};

export default agentService;