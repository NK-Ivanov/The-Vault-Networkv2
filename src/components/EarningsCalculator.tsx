import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, X, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Automation {
  id: string;
  name: string;
  setup_price: number;
  monthly_price: number;
  default_commission_rate: number | null;
}

interface CalculatorRow {
  automationId: string;
  clientsPerAutomation: number;
}

interface EarningsCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  currentCommissionRate: number;
  onComplete?: (taskType: 'task1' | 'task4') => void;
}

const EarningsCalculator: React.FC<EarningsCalculatorProps> = ({
  open,
  onOpenChange,
  sellerId,
  currentCommissionRate,
  onComplete
}) => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [selectedRows, setSelectedRows] = useState<CalculatorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasUsedCalculator, setHasUsedCalculator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAutomations();
      checkCalculatorUsage();
    }
  }, [open, sellerId]);

  const fetchAutomations = async () => {
    try {
      // Fetch automations assigned to this seller
      const { data: sellerAutomations, error: sellerError } = await supabase
        .from('seller_automations')
        .select('automation_id')
        .eq('seller_id', sellerId);

      if (sellerError) throw sellerError;

      const automationIds = (sellerAutomations || []).map((sa: any) => sa.automation_id);

      if (automationIds.length === 0) {
        // If no assigned automations, show all active automations
        const { data: allAutomations, error: allError } = await supabase
          .from('automations')
          .select('id, name, setup_price, monthly_price, default_commission_rate')
          .eq('is_active', true)
          .order('name');

        if (allError) throw allError;
        setAutomations(allAutomations || []);
      } else {
        // Fetch assigned automations
        const { data: assignedAutomations, error: assignedError } = await supabase
          .from('automations')
          .select('id, name, setup_price, monthly_price, default_commission_rate')
          .in('id', automationIds)
          .eq('is_active', true)
          .order('name');

        if (assignedError) throw assignedError;
        setAutomations(assignedAutomations || []);
      }
    } catch (error: any) {
      console.error('Error fetching automations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automations. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const checkCalculatorUsage = async () => {
    try {
      // Check if user has used calculator before (for task tracking)
      const { data } = await supabase
        .from('partner_activity_log')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('event_type', 'earnings_calculator_used')
        .maybeSingle();

      setHasUsedCalculator(!!data);
    } catch (error) {
      console.error('Error checking calculator usage:', error);
    }
  };

  const addRow = () => {
    if (automations.length === 0) {
      toast({
        title: 'No automations available',
        description: 'Please wait for automations to load.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRows([...selectedRows, { automationId: automations[0].id, clientsPerAutomation: 1 }]);
  };

  const removeRow = (index: number) => {
    setSelectedRows(selectedRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof CalculatorRow, value: string | number) => {
    const newRows = [...selectedRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setSelectedRows(newRows);
  };

  const getAutomationForId = (id: string): Automation | undefined => {
    return automations.find(a => a.id === id);
  };

  const calculateCommission = (
    amount: number,
    commissionRate: number
  ): { sellerEarnings: number; vaultShare: number } => {
    const sellerEarnings = (amount * commissionRate) / 100;
    const vaultShare = amount - sellerEarnings;
    return { sellerEarnings, vaultShare };
  };

  const calculateTotals = () => {
    let totalSetupRevenue = 0;
    let totalMonthlyRevenue = 0;
    let totalSetupEarnings = 0;
    let totalMonthlyEarnings = 0;
    let totalSetupEarningsPro = 0;
    let totalMonthlyEarningsPro = 0;

    selectedRows.forEach(row => {
      const automation = getAutomationForId(row.automationId);
      if (!automation) return;

      const setupRevenue = automation.setup_price * row.clientsPerAutomation;
      const monthlyRevenue = automation.monthly_price * row.clientsPerAutomation;

      totalSetupRevenue += setupRevenue;
      totalMonthlyRevenue += monthlyRevenue;

      const { sellerEarnings: setupEarnings } = calculateCommission(setupRevenue, currentCommissionRate);
      const { sellerEarnings: monthlyEarnings } = calculateCommission(monthlyRevenue, currentCommissionRate);

      totalSetupEarnings += setupEarnings;
      totalMonthlyEarnings += monthlyEarnings;

      const { sellerEarnings: setupEarningsPro } = calculateCommission(setupRevenue, 45);
      const { sellerEarnings: monthlyEarningsPro } = calculateCommission(monthlyRevenue, 45);

      totalSetupEarningsPro += setupEarningsPro;
      totalMonthlyEarningsPro += monthlyEarningsPro;
    });

    return {
      totalSetupRevenue,
      totalMonthlyRevenue,
      totalSetupEarnings,
      totalMonthlyEarnings,
      totalSetupEarningsPro,
      totalMonthlyEarningsPro,
    };
  };

  const trackCalculatorUsage = async () => {
    try {
      // Track calculator usage (allow multiple saves, just track activity)
      const { error: insertError } = await supabase.from('partner_activity_log').insert({
        seller_id: sellerId,
        event_type: 'earnings_calculator_used',
        xp_value: 0,
        description: 'Used Earnings Calculator',
        metadata: {
          rows_count: selectedRows.length,
          automations_compared: selectedRows.length,
          clients_per_automation: selectedRows.reduce((sum, row) => sum + row.clientsPerAutomation, 0),
        },
      });

      if (insertError) {
        console.error('Error inserting calculator usage:', insertError);
      } else {
        // Only set hasUsedCalculator after successful insert
        if (!hasUsedCalculator) {
          setHasUsedCalculator(true);
        }
      }

      // Always check for task completion when Save & Track is clicked
      // Task 1: Review Setup vs Monthly Pricing for 3 Automations (600 XP)
      // Need at least 3 different automations
      if (selectedRows.length >= 3 && onComplete) {
        const uniqueAutomationIds = new Set(selectedRows.map(row => row.automationId));
        if (uniqueAutomationIds.size >= 3) {
          // Call onComplete for task1
          onComplete('task1');
        }
      }

      // Task 4: Earnings Projection Exercise (500 XP) - using calculator with 3 clients total
      const totalClients = selectedRows.reduce((sum, row) => sum + row.clientsPerAutomation, 0);
      if (totalClients >= 3 && onComplete) {
        // Call onComplete for task4
        onComplete('task4');
      }
    } catch (error: any) {
      console.error('Error tracking calculator usage:', error);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Earnings Calculator
          </DialogTitle>
          <DialogDescription>
            Compare setup fees and monthly pricing for automations. Calculate your projected commission earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Commission Rate Display */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Commission Rate</p>
                  <p className="text-2xl font-bold text-primary">{currentCommissionRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">With Partner Pro</p>
                  <p className="text-lg font-semibold text-primary">45%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculator Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Automations & Clients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                disabled={selectedRows.length >= 10}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Automation
              </Button>
            </div>

            {selectedRows.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Add Automation" to start calculating earnings
                  </p>
                  <Button type="button" variant="outline" onClick={addRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Automation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              selectedRows.map((row, index) => {
                const automation = getAutomationForId(row.automationId);
                if (!automation) return null;

                const setupRevenue = automation.setup_price * row.clientsPerAutomation;
                const monthlyRevenue = automation.monthly_price * row.clientsPerAutomation;
                const { sellerEarnings: setupEarnings } = calculateCommission(setupRevenue, currentCommissionRate);
                const { sellerEarnings: monthlyEarnings } = calculateCommission(monthlyRevenue, currentCommissionRate);
                const { sellerEarnings: setupEarningsPro } = calculateCommission(setupRevenue, 45);
                const { sellerEarnings: monthlyEarningsPro } = calculateCommission(monthlyRevenue, 45);

                return (
                  <Card key={index} className="border-border">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        <div className="md:col-span-4 space-y-2">
                          <Label htmlFor={`automation-${index}`}>Automation</Label>
                          <Select
                            value={row.automationId}
                            onValueChange={(value) => updateRow(index, 'automationId', value)}
                          >
                            <SelectTrigger id={`automation-${index}`}>
                              <SelectValue placeholder="Select automation" />
                            </SelectTrigger>
                            <SelectContent>
                              {automations.map((auto) => (
                                <SelectItem key={auto.id} value={auto.id}>
                                  {auto.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor={`clients-${index}`}>Clients</Label>
                          <Input
                            id={`clients-${index}`}
                            type="number"
                            min="1"
                            max="100"
                            value={row.clientsPerAutomation}
                            onChange={(e) => updateRow(index, 'clientsPerAutomation', parseInt(e.target.value) || 1)}
                          />
                        </div>

                        <div className="md:col-span-6 space-y-2">
                          <Label>Earnings Preview</Label>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground">Setup ({currentCommissionRate}%)</div>
                              <div className="font-semibold">${setupEarnings.toFixed(2)}</div>
                              {currentCommissionRate !== 45 && (
                                <div className="text-xs text-muted-foreground">
                                  Pro: ${setupEarningsPro.toFixed(2)}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Monthly ({currentCommissionRate}%)</div>
                              <div className="font-semibold">${monthlyEarnings.toFixed(2)}</div>
                              {currentCommissionRate !== 45 && (
                                <div className="text-xs text-muted-foreground">
                                  Pro: ${monthlyEarningsPro.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-12 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRow(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Automation Details */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Setup Fee:</span>
                            <span className="ml-1 font-medium">${automation.setup_price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly:</span>
                            <span className="ml-1 font-medium">${automation.monthly_price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Setup:</span>
                            <span className="ml-1 font-medium">${setupRevenue.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Monthly:</span>
                            <span className="ml-1 font-medium">${monthlyRevenue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Totals Summary */}
          {selectedRows.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Projected Earnings Summary
                </CardTitle>
                <CardDescription>
                  Based on your current commission rate of {currentCommissionRate}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Setup Earnings</div>
                    <div className="text-xl font-bold text-primary">${totals.totalSetupEarnings.toFixed(2)}</div>
                    {currentCommissionRate !== 45 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        With Partner Pro: ${totals.totalSetupEarningsPro.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Monthly Earnings</div>
                    <div className="text-xl font-bold text-primary">${totals.totalMonthlyEarnings.toFixed(2)}</div>
                    {currentCommissionRate !== 45 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        With Partner Pro: ${totals.totalMonthlyEarningsPro.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Setup Revenue</div>
                    <div className="text-lg font-semibold">${totals.totalSetupRevenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total Monthly Revenue</div>
                    <div className="text-lg font-semibold">${totals.totalMonthlyRevenue.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Completion Info */}
          {selectedRows.length >= 3 && (
            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-4">
                <p className="text-sm text-primary font-medium">
                  ✓ Comparing {selectedRows.length} automations - Task progress tracked!
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {selectedRows.length > 0 && (
            <Button
              onClick={() => {
                trackCalculatorUsage();
                toast({
                  title: 'Calculator saved',
                  description: 'Your calculations have been tracked for task completion.',
                });
              }}
            >
              Save & Track
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EarningsCalculator;

