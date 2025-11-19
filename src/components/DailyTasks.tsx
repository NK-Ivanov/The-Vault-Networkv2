import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lock, Sparkles } from 'lucide-react';
import { getTodaysDailyTasks, type DailyTask } from '@/lib/daily-tasks';
import { type PartnerRank } from '@/lib/partner-progression';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface DailyTasksProps {
  rank: PartnerRank;
  completedTasks: Set<string>;
  onTaskStart?: (taskId: string, action?: string) => void;
}

const DailyTasks: React.FC<DailyTasksProps> = ({ rank, completedTasks, onTaskStart }) => {
  const tasks = getTodaysDailyTasks(rank);
  const isPro = rank === 'Partner Pro';
  
  const handleTaskClick = (task: DailyTask, isLocked: boolean) => {
    if (isLocked) {
      return;
    }
    
    if (onTaskStart && !completedTasks.has(task.id)) {
      onTaskStart(task.id, task.action);
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  const [task1, task2] = tasks;
  const isTask1Completed = completedTasks.has(task1.id);
  const isTask2Completed = completedTasks.has(task2.id);
  const isTask2Locked = !isPro;

  return (
    <div className="space-y-4">
      {/* Task 1 - Always Available */}
      <Card className={`border-2 transition-all ${isTask1Completed ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary">
                  Daily Task 1
                </Badge>
                {isTask1Completed && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm">{task1.title}</h4>
              <p className="text-xs text-muted-foreground">{task1.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {task1.xpReward} XP
                </Badge>
              </div>
            </div>
            <div className="shrink-0">
              {isTask1Completed ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleTaskClick(task1, false)}
                  className="text-xs"
                >
                  Start Task
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task 2 - Locked for Non-Pro */}
      <Card className={`border-2 transition-all relative ${isTask2Locked ? 'border-border/50 bg-muted/20' : isTask2Completed ? 'border-primary/50 bg-primary/5' : 'border-border'}`}>
        {isTask2Locked && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="text-center space-y-3 p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="border-primary text-primary">
                  Unlock with Pro
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                This daily task is available for Partner Pro members
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  disabled
                >
                  Coming Soon
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs">
                      Find Out More
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upgrade to Partner Pro</DialogTitle>
                      <DialogDescription>
                        Unlock premium features and exclusive daily tasks.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Upgrade to Partner Pro to unlock:
                        </p>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-semibold mb-2">Partner Pro Benefits:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>45% commission rate (vs 40% standard)</li>
                            <li>Premium daily tasks (300 XP each)</li>
                            <li>Advanced analytics dashboard</li>
                            <li>Access to premium automations</li>
                            <li>Priority customer support</li>
                            <li>Early access to new features</li>
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1">
                          Learn More
                        </Button>
                        <Button className="flex-1">
                          Upgrade Now
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
        <CardContent className={`p-4 ${isTask2Locked ? 'blur-sm' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary">
                  Daily Task 2
                </Badge>
                {!isTask2Locked && isTask2Completed && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm">{task2.title}</h4>
              <p className="text-xs text-muted-foreground">{task2.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {task2.xpReward} XP
                </Badge>
              </div>
            </div>
            <div className="shrink-0">
              {isTask2Locked ? null : isTask2Completed ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleTaskClick(task2, false)}
                  className="text-xs"
                >
                  Start Task
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyTasks;

