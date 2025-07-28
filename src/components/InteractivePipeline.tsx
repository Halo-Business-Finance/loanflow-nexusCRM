import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Mail, Plus, Edit3, MoveRight, DollarSign, Users, MoreVertical, Archive } from "lucide-react";
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

interface StageData {
  name: string;
  entries: PipelineEntry[];
  count: number;
  value: number;
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
  switch (priority?.toLowerCase()) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'default';
  }
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Initial Contact': return 'bg-blue-50 border-blue-200';
    case 'Qualification': return 'bg-yellow-50 border-yellow-200';
    case 'Proposal': return 'bg-purple-50 border-purple-200';
    case 'Negotiation': return 'bg-orange-50 border-orange-200';
    case 'Closing': return 'bg-green-50 border-green-200';
    case 'Won': return 'bg-emerald-50 border-emerald-200';
    case 'Lost': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

export default function InteractivePipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pipelineData, setPipelineData] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<PipelineEntry | null>(null);
  const [moveStage, setMoveStage] = useState<string>('');

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

  const handleAddNote = (entryId: string) => {
    if (newNote.trim()) {
      updateEntry(entryId, { notes: newNote });
      setNewNote('');
      setEditingEntry(null);
    }
  };

  const handleMoveEntry = () => {
    if (selectedEntry && moveStage) {
      updateEntryStage(selectedEntry.id, moveStage);
      setSelectedEntry(null);
      setMoveStage('');
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, [user]);

  // Organize data by stage
  const stageData: StageData[] = stages.map(stage => {
    const entries = pipelineData.filter(entry => entry.stage === stage);
    const totalValue = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    return {
      name: stage,
      entries,
      count: entries.length,
      value: totalValue
    };
  });

  const totalValue = pipelineData.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  const totalEntries = pipelineData.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalEntries}</div>
            <p className="text-sm text-muted-foreground">Active pipeline entries</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              ${(totalValue / 1000000).toFixed(1)}M
            </div>
            <p className="text-sm text-muted-foreground">Total opportunity value</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {totalEntries > 0 ? Math.round((stageData.find(s => s.name === 'Won')?.count || 0) / totalEntries * 100) : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Won vs total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {stageData.map((stage) => (
          <div key={stage.name} className="space-y-4">
            {/* Stage Header */}
            <Card className={`shadow-soft ${getStageColor(stage.name)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-center">
                  {stage.name}
                </CardTitle>
                <div className="text-center space-y-1">
                  <div className="text-lg font-bold">{stage.count}</div>
                  <div className="text-xs text-muted-foreground">
                    ${(stage.value / 1000).toFixed(0)}K
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stage Entries */}
            <div className="space-y-3 min-h-[400px]">
              {stage.entries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer border-l-4 border-l-primary"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Entry Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {entry.lead?.name || entry.client?.name}
                          </h4>
                          <p className="text-lg font-bold text-accent">
                            ${entry.amount?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={getPriorityColor(entry.priority)} className="text-xs">
                            {entry.priority}
                          </Badge>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => setSelectedEntry(entry)}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Move Entry</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Move "{entry.lead?.name || entry.client?.name}" to:</p>
                                <Select value={moveStage} onValueChange={setMoveStage}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages.filter(s => s !== entry.stage).map(stage => (
                                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button onClick={handleMoveEntry} disabled={!moveStage}>
                                    <MoveRight className="h-4 w-4 mr-2" />
                                    Move Entry
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex items-center gap-2">
                        <PhoneDialer 
                          trigger={
                            <Button size="sm" variant="outline" className="h-7 px-2 flex-1">
                              <Phone className="h-3 w-3" />
                            </Button>
                          }
                        />
                        
                        <EmailComposer 
                          trigger={
                            <Button size="sm" variant="outline" className="h-7 px-2 flex-1">
                              <Mail className="h-3 w-3" />
                            </Button>
                          }
                        />

                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 flex-1"
                          onClick={() => setEditingEntry(editingEntry === entry.id ? null : entry.id)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Notes Section */}
                      {entry.notes && (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
                          {entry.notes}
                        </div>
                      )}

                      {/* Edit Form */}
                      {editingEntry === entry.id && (
                        <div className="space-y-2 border-t pt-2">
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
                              className="h-6 text-xs flex-1"
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
                              className="h-6 text-xs flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Last Contact */}
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Last contact: {new Date(entry.last_contact).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add Entry Button */}
              <Card className="shadow-soft border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-4 text-center">
                  <Button variant="ghost" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}