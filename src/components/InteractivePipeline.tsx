import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, User, Calendar, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  loan_amount?: number;
  priority: string;
  last_contact?: string;
  stage: string;
}

// Custom Node Component for Pipeline Stages
const StageNode = ({ data }: { data: any }) => {
  const { stage, leads, color } = data;

  return (
    <div className="bg-background border-2 border-border rounded-lg p-4 min-w-[300px] shadow-md">
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{stage}</h3>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {leads.map((lead: LeadData) => (
            <Card key={lead.id} className="cursor-move hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{lead.name}</span>
                    </div>
                    
                    {lead.loan_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          ${lead.loan_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      {lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                            {lead.email}
                          </span>
                        </div>
                      )}
                      
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {lead.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge 
                    variant={
                      lead.priority === 'high' ? 'destructive' : 
                      lead.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {lead.priority}
                  </Badge>
                </div>
                
                {lead.last_contact && (
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Last contact: {new Date(lead.last_contact).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
};

const nodeTypes = {
  stage: StageNode,
};

const stageOrder = ["Initial Contact", "Qualified", "Application", "Pre-approval", "Documentation", "Closing", "Funded"];
const stageColors = {
  "Initial Contact": "#f3f4f6",
  "Qualified": "#fef3c7", 
  "Application": "#dbeafe",
  "Pre-approval": "#fce7f3",
  "Documentation": "#f0f9ff",
  "Closing": "#ecfdf5",
  "Funded": "#f0fdf4"
};

export function InteractivePipeline() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;

      setLeads(data || []);
      generatePipelineNodes(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to load pipeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePipelineNodes = (leadsData: LeadData[]) => {
    const stageGroups: { [key: string]: LeadData[] } = {};
    
    // Initialize stage groups
    stageOrder.forEach(stage => {
      stageGroups[stage] = [];
    });

    // Group leads by stage
    leadsData.forEach(lead => {
      if (stageGroups[lead.stage]) {
        stageGroups[lead.stage].push(lead);
      }
    });

    // Create nodes for each stage
    const newNodes: Node[] = stageOrder.map((stage, index) => ({
      id: `stage-${index}`,
      type: 'stage',
      position: { x: index * 350, y: 50 },
      data: {
        stage,
        leads: stageGroups[stage],
        color: stageColors[stage as keyof typeof stageColors]
      },
      dragHandle: '.drag-handle',
    }));

    // Create edges between stages
    const newEdges: Edge[] = [];
    for (let i = 0; i < stageOrder.length - 1; i++) {
      newEdges.push({
        id: `edge-${i}`,
        source: `stage-${i}`,
        target: `stage-${i + 1}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Lead moved to ${newStage}`,
      });

      // Refresh the data
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interactive Sales Pipeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag leads between stages to update their status
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/30 rounded-lg"
            minZoom={0.3}
            maxZoom={1.5}
          >
            <MiniMap 
              nodeColor={(node) => {
                return (node.data?.color as string) || '#6366f1';
              }}
              className="!bg-background border border-border"
              pannable
              zoomable
            />
            <Controls className="!bg-background border border-border" />
            <Background 
              color="#94a3b8" 
              gap={20} 
              size={1}
              className="opacity-50"
            />
          </ReactFlow>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Total Leads: {leads.length}
          </div>
          <div>
            Pipeline Value: ${leads.reduce((sum, lead) => sum + (lead.loan_amount || 0), 0).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}