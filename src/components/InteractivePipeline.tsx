import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Plus, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { PhoneDialer } from "@/components/PhoneDialer";
import { EmailComposer } from "@/components/EmailComposer";

interface PipelineEntry {
  id: string;
  stage: string;
  amount: number;
  priority: string;
  last_contact: string;
  notes?: string;
  lead?: {
    name: string;
    email: string;
    phone?: string;
  };
  client?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface StageNodeData {
  stage: string;
  entries: PipelineEntry[];
  onMoveEntry: (entryId: string, newStage: string) => void;
  onUpdateEntry: (entryId: string, updates: Partial<PipelineEntry>) => void;
}

const stages = [
  "Initial Contact",
  "Qualification", 
  "Proposal",
  "Negotiation",
  "Closing",
  "Won",
  "Lost"
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const StageNode = ({ data }: { data: StageNodeData }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const entryId = event.dataTransfer.getData('application/json');
    if (entryId) {
      data.onMoveEntry(entryId, data.stage);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleAddNote = (entryId: string) => {
    if (newNote.trim()) {
      data.onUpdateEntry(entryId, { notes: newNote });
      setNewNote('');
      setEditingEntry(null);
    }
  };

  const totalValue = data.entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);

  return (
    <div 
      className="bg-background border rounded-lg p-4 min-w-[300px] max-w-[350px]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{data.stage}</h3>
          <p className="text-sm text-muted-foreground">
            {data.entries.length} entries • ${totalValue.toLocaleString()}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {data.entries.map((entry) => (
          <Card
            key={entry.id}
            className="cursor-move hover:shadow-md transition-shadow"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', entry.id);
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">
                    {entry.lead?.name || entry.client?.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    ${entry.amount?.toLocaleString()}
                  </p>
                </div>
                <Badge variant={getPriorityColor(entry.priority)} className="text-xs">
                  {entry.priority}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <PhoneDialer 
                  trigger={
                    <Button size="sm" variant="outline" className="h-6 px-2">
                      <Phone className="h-3 w-3" />
                    </Button>
                  }
                />
                
                <EmailComposer 
                  trigger={
                    <Button size="sm" variant="outline" className="h-6 px-2">
                      <Mail className="h-3 w-3" />
                    </Button>
                  }
                />

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-6 px-2"
                  onClick={() => setEditingEntry(editingEntry === entry.id ? null : entry.id)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>

              {entry.notes && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded mb-2">
                  {entry.notes}
                </p>
              )}

              {editingEntry === entry.id && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="text-xs"
                    rows={2}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleAddNote(entry.id)}
                      className="h-6 text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingEntry(null);
                        setNewNote('');
                      }}
                      className="h-6 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Last contact: {new Date(entry.last_contact).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  stage: StageNode,
};

export default function InteractivePipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pipelineData, setPipelineData] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const fetchPipelineData = async () => {
    if (!user) return;

    try {
      const { data: pipelineEntries, error } = await supabase
        .from('pipeline_entries')
        .select(`
          *,
          lead:leads(*),
          client:clients(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setPipelineData(pipelineEntries || []);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pipeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  function handleMoveEntry(entryId: string, newStage: string) {
    updateEntryStage(entryId, newStage);
  }

  function handleUpdateEntry(entryId: string, updates: Partial<PipelineEntry>) {
    updateEntry(entryId, updates);
  }

  const updateEntryStage = async (entryId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_entries')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', entryId);

      if (error) throw error;

      setPipelineData(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, stage: newStage } : entry
        )
      );

      toast({
        title: "Success",
        description: `Entry moved to ${newStage}`,
      });
    } catch (error) {
      console.error('Error updating entry stage:', error);
      toast({
        title: "Error",
        description: "Failed to update entry stage",
        variant: "destructive",
      });
    }
  };

  const updateEntry = async (entryId: string, updates: Partial<PipelineEntry>) => {
    try {
      const { error } = await supabase
        .from('pipeline_entries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', entryId);

      if (error) throw error;

      setPipelineData(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, ...updates } : entry
        )
      );

      toast({
        title: "Success",
        description: "Entry updated successfully",
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: "Failed to update entry",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, [user]);

  useEffect(() => {
    // Initialize nodes with handlers
    const initialNodes: Node[] = stages.map((stage, index) => ({
      id: stage,
      type: 'stage',
      position: { x: index * 380, y: 0 },
      data: {
        stage,
        entries: pipelineData.filter(entry => entry.stage === stage),
        onMoveEntry: handleMoveEntry,
        onUpdateEntry: handleUpdateEntry,
      },
    }));
    
    setNodes(initialNodes);
  }, [pipelineData, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}